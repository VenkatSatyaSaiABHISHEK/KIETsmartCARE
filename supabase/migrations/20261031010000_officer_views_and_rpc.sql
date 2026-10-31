-- ==============================================================================
-- KIET Smart Care - Campus Health Officer Surveillance Views & RPCs
-- Privacy Enforced: Aggregate metrics only; never exposes raw rows to client
-- ==============================================================================

-- 1. Daily Visits Time-Series View
CREATE OR REPLACE VIEW view_officer_daily_visits AS
SELECT
  DATE(created_at) AS visit_date,
  COUNT(*) AS total_visits
FROM visits
GROUP BY DATE(created_at)
ORDER BY visit_date ASC;

-- 2. Problem Categories Distribution View
CREATE OR REPLACE VIEW view_officer_problem_categories AS
SELECT
  problem_category,
  COUNT(*) AS case_count
FROM visits
GROUP BY problem_category
ORDER BY case_count DESC;

-- 3. Recovery Outcome Aggregates View (For Donut Chart)
CREATE OR REPLACE VIEW view_officer_recovery_distribution AS
SELECT
  status AS recovery_outcome,
  COUNT(*) AS count,
  ROUND((COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0)), 1) AS percentage
FROM recovery_checks
WHERE status IS NOT NULL
GROUP BY status;

-- 4. Dose Adherence Trend View (Confirmed vs Missed)
CREATE OR REPLACE VIEW view_officer_adherence_trend AS
SELECT
  DATE(scheduled_time) AS schedule_date,
  COUNT(*) AS total_scheduled,
  COUNT(*) FILTER (WHERE status IN ('taken', 'taken_late')) AS confirmed_taken,
  COUNT(*) FILTER (WHERE status = 'not_taken') AS marked_missed,
  COUNT(*) FILTER (WHERE status = 'unconfirmed') AS unconfirmed,
  ROUND(
    (COUNT(*) FILTER (WHERE status IN ('taken', 'taken_late')) * 100.0 / NULLIF(COUNT(*), 0)),
    1
  ) AS adherence_rate_pct
FROM dose_schedule
GROUP BY DATE(scheduled_time)
ORDER BY schedule_date ASC;

-- 5. Primary KPI RPC Function
CREATE OR REPLACE FUNCTION get_officer_dashboard_metrics(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_branch TEXT DEFAULT NULL,
  p_year INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verify caller role is officer or admin (RLS security enforcement)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('officer', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Campus Health Officers can execute surveillance queries.';
  END IF;

  SELECT jsonb_build_object(
    'students_treated', (
      SELECT COUNT(DISTINCT student_id) 
      FROM visits v
      JOIN student_profiles sp ON sp.id = v.student_id
      WHERE DATE(v.created_at) BETWEEN p_start_date AND p_end_date
        AND (p_branch IS NULL OR sp.department = p_branch)
        AND (p_year IS NULL OR sp.year = p_year)
    ),
    'alarms_active', (
      SELECT COUNT(DISTINCT student_id) 
      FROM dose_schedule ds
      WHERE ds.status = 'scheduled'
    ),
    'doses_confirmed_pct', (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('taken', 'taken_late')) * 100.0 / NULLIF(COUNT(*), 0)),
          1
        ),
        0.0
      )
      FROM dose_schedule
      WHERE DATE(scheduled_time) BETWEEN p_start_date AND p_end_date
    ),
    'recovered_count', (
      SELECT COUNT(*) 
      FROM recovery_checks rc
      WHERE rc.status = 'better'
        AND DATE(rc.created_at) BETWEEN p_start_date AND p_end_date
    ),
    'not_recovered_count', (
      SELECT COUNT(*) 
      FROM recovery_checks rc
      WHERE rc.status IN ('same', 'worse', 'side_effect')
        AND DATE(rc.created_at) BETWEEN p_start_date AND p_end_date
    ),
    'open_red_alerts', (
      SELECT COUNT(*) 
      FROM alerts a
      WHERE a.alert_level = 'red' AND a.status IN ('active', 'under_review')
    ),
    'no_response_cases', (
      SELECT COUNT(*) 
      FROM alerts a
      WHERE a.alert_level = 'yellow' AND a.status IN ('active', 'under_review')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 6. Officer Audit Log Trigger Function for Viewing Flagged Cases
CREATE OR REPLACE FUNCTION log_officer_case_view(
  p_alert_id UUID,
  p_roll_number TEXT,
  p_officer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    description,
    metadata,
    created_at
  ) VALUES (
    p_officer_id,
    'officer',
    'READ',
    'flagged_cases',
    p_alert_id,
    FORMAT('Health Officer opened flagged case for student roll %s', p_roll_number),
    jsonb_build_object('alert_id', p_alert_id, 'roll_number', p_roll_number),
    NOW()
  );
END;
$$;
