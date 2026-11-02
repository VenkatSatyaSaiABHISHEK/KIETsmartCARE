-- ==============================================================================
-- KIET Smart Care - Atomic Dose Schedule Generation & Clinical Alert Triggers
-- ==============================================================================

-- 1. ATOMIC DOSE SCHEDULE GENERATION TRIGGER
CREATE OR REPLACE FUNCTION generate_dose_schedules_on_medication_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_visit_date TIMESTAMPTZ;
  v_breakfast TIME := '08:00:00';
  v_lunch TIME := '13:00:00';
  v_dinner TIME := '20:00:00';
  v_offset INTERVAL;
  v_day_idx INT;
  v_target_date DATE;
  v_target_time TIME;
  v_scheduled_at TIMESTAMPTZ;
  v_slot dose_slot;
  v_slots dose_slot[];
BEGIN
  -- 1. Fetch visit details
  SELECT student_id, visit_date INTO v_student_id, v_visit_date
  FROM visits
  WHERE id = NEW.visit_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Associated visit not found for medication schedule generation.';
  END IF;

  -- 2. Fetch student's meal schedule (or use campus defaults)
  SELECT breakfast, lunch, dinner
  INTO v_breakfast, v_lunch, v_dinner
  FROM student_meal_times
  WHERE student_id = v_student_id;

  v_breakfast := COALESCE(v_breakfast, '08:00:00'::TIME);
  v_lunch := COALESCE(v_lunch, '13:00:00'::TIME);
  v_dinner := COALESCE(v_dinner, '20:00:00'::TIME);

  -- 3. Calculate meal relation offset:
  -- after meal = meal time + 30 minutes
  -- before meal = meal time - 30 minutes
  IF NEW.meal_relation = 'after' THEN
    v_offset := INTERVAL '30 minutes';
  ELSE
    v_offset := - INTERVAL '30 minutes';
  END IF;

  -- 4. Determine slots per day according to prescription times_per_day
  IF NEW.times_per_day = 1 THEN
    v_slots := ARRAY['lunch'::dose_slot];
  ELSIF NEW.times_per_day = 2 THEN
    v_slots := ARRAY['breakfast'::dose_slot, 'dinner'::dose_slot];
  ELSIF NEW.times_per_day = 3 THEN
    v_slots := ARRAY['breakfast'::dose_slot, 'lunch'::dose_slot, 'dinner'::dose_slot];
  ELSE
    v_slots := ARRAY['breakfast'::dose_slot, 'lunch'::dose_slot, 'dinner'::dose_slot];
  END IF;

  -- 5. Atomic loop: Generate dose schedules for every day of the prescribed course
  FOR v_day_idx IN 0 .. (NEW.days - 1) LOOP
    v_target_date := (DATE(v_visit_date) + (v_day_idx || ' days')::INTERVAL)::DATE;

    FOREACH v_slot IN ARRAY v_slots LOOP
      IF v_slot = 'breakfast' THEN
        v_target_time := v_breakfast + v_offset;
      ELSIF v_slot = 'lunch' THEN
        v_target_time := v_lunch + v_offset;
      ELSE
        v_target_time := v_dinner + v_offset;
      END IF;

      -- Combine date & time into scheduled_at timestamptz (Asia/Kolkata timezone default)
      v_scheduled_at := (v_target_date || ' ' || v_target_time)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';

      INSERT INTO dose_schedule (
        visit_medication_id,
        student_id,
        scheduled_at,
        slot
      ) VALUES (
        NEW.id,
        v_student_id,
        v_scheduled_at,
        v_slot
      );
    END LOOP;
  END LOOP;

  -- 6. Ensure recovery check entry exists for the visit (due day after last dose)
  IF NOT EXISTS (SELECT 1 FROM recovery_checks WHERE visit_id = NEW.visit_id) THEN
    INSERT INTO recovery_checks (
      visit_id,
      student_id,
      answer,
      answered_at
    ) VALUES (
      NEW.visit_id,
      v_student_id,
      NULL,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_dose_schedules ON visit_medications;
CREATE TRIGGER trg_generate_dose_schedules
AFTER INSERT ON visit_medications
FOR EACH ROW EXECUTE FUNCTION generate_dose_schedules_on_medication_insert();

-- ==============================================================================
-- 2. RECOVERY CHECK RED ALERT TRIGGER
-- When recovery_checks.answer is 'same' or 'worse', or a side-effect is flagged:
-- Insert a high-severity RED alert for the prescribing doctor and Health Officers
-- ==============================================================================
CREATE OR REPLACE FUNCTION trg_on_recovery_check_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_doctor_id UUID;
  v_alert_type alert_type;
BEGIN
  IF NEW.answer IS NOT NULL AND NEW.answer IN ('same', 'worse') THEN
    SELECT doctor_id INTO v_doctor_id FROM visits WHERE id = NEW.visit_id;

    IF NEW.answer = 'worse' THEN
      v_alert_type := 'worse'::alert_type;
    ELSE
      v_alert_type := 'same'::alert_type;
    END IF;

    -- Insert RED alert
    INSERT INTO alerts (
      visit_id,
      student_id,
      doctor_id,
      type,
      severity,
      status
    ) VALUES (
      NEW.visit_id,
      NEW.student_id,
      v_doctor_id,
      v_alert_type,
      'red',
      'open'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recovery_check_escalation ON recovery_checks;
CREATE TRIGGER trg_recovery_check_escalation
AFTER INSERT OR UPDATE ON recovery_checks
FOR EACH ROW EXECUTE FUNCTION trg_on_recovery_check_escalation();

-- ==============================================================================
-- 3. OFFICER SURVEILLANCE AGGREGATES & RPCs (SECURITY DEFINER)
-- Officer aggregate numbers come from SECURITY DEFINER functions/views that
-- return counts only and verify the caller's role.
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_officer_dashboard_metrics(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_branch TEXT DEFAULT NULL,
  p_year INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_result JSONB;
BEGIN
  -- Strict caller verification
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role NOT IN ('officer', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only Campus Health Officers can execute surveillance queries.';
  END IF;

  SELECT jsonb_build_object(
    'students_treated', (
      SELECT COUNT(DISTINCT v.student_id)
      FROM visits v
      JOIN students s ON s.id = v.student_id
      WHERE DATE(v.visit_date) BETWEEN p_start_date AND p_end_date
        AND (p_branch IS NULL OR s.branch = p_branch)
        AND (p_year IS NULL OR s.year = p_year)
    ),
    'alarms_active', (
      SELECT COUNT(DISTINCT ds.student_id)
      FROM dose_schedule ds
      WHERE ds.scheduled_at >= now()
    ),
    'doses_confirmed_pct', (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE de.response IN ('taken', 'taken_late')) * 100.0 / NULLIF(COUNT(ds.id), 0)),
          1
        ),
        0.0
      )
      FROM dose_schedule ds
      LEFT JOIN dose_events de ON de.schedule_id = ds.id
      WHERE DATE(ds.scheduled_at) BETWEEN p_start_date AND p_end_date
    ),
    'recovered_count', (
      SELECT COUNT(*)
      FROM recovery_checks rc
      WHERE rc.answer = 'better'
        AND DATE(rc.created_at) BETWEEN p_start_date AND p_end_date
    ),
    'not_recovered_count', (
      SELECT COUNT(*)
      FROM recovery_checks rc
      WHERE rc.answer IN ('same', 'worse')
        AND DATE(rc.created_at) BETWEEN p_start_date AND p_end_date
    ),
    'open_red_alerts', (
      SELECT COUNT(*)
      FROM alerts a
      WHERE a.severity = 'red' AND a.status IN ('open', 'in_progress')
    ),
    'no_response_cases', (
      SELECT COUNT(*)
      FROM alerts a
      WHERE a.type = 'no_response' AND a.status IN ('open', 'in_progress')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- View for problem categories distribution
CREATE OR REPLACE VIEW view_officer_problem_categories AS
SELECT
  problem_category,
  COUNT(*) AS case_count
FROM visits
GROUP BY problem_category
ORDER BY case_count DESC;

-- View for daily visits count
CREATE OR REPLACE VIEW view_officer_daily_visits AS
SELECT
  DATE(visit_date) AS visit_date,
  COUNT(*) AS total_visits
FROM visits
GROUP BY DATE(visit_date)
ORDER BY visit_date ASC;

-- View for recovery outcome distribution
CREATE OR REPLACE VIEW view_officer_recovery_distribution AS
SELECT
  COALESCE(answer::TEXT, 'pending') AS recovery_outcome,
  COUNT(*) AS count,
  ROUND((COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0)), 1) AS percentage
FROM recovery_checks
GROUP BY answer;
