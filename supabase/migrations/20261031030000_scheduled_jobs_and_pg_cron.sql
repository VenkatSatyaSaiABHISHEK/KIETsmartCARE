-- ==============================================================================
-- KIET Smart Care - Scheduled Jobs, Adherence Sweeps & pg_cron
-- ==============================================================================

-- 1. EXTENSIONS FOR CRON & ASYNC HTTP
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. PROCEDURE: SET UNANSWERED DOSES TO UNCONFIRMED NEXT MORNING
CREATE OR REPLACE FUNCTION process_unconfirmed_doses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  -- Select all past scheduled doses prior to current date in India (UTC+5:30)
  -- that do NOT have any recorded response in dose_events
  FOR r IN
    SELECT ds.id AS schedule_id, ds.student_id
    FROM dose_schedule ds
    LEFT JOIN dose_events de ON de.schedule_id = ds.id
    WHERE ds.scheduled_at < (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')
      AND de.id IS NULL
  LOOP
    INSERT INTO dose_events (
      schedule_id,
      student_id,
      response,
      responded_at
    ) VALUES (
      r.schedule_id,
      r.student_id,
      'unconfirmed',
      now()
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 3. PROCEDURE: ESCALATE UNANSWERED RECOVERY CHECKS (24 HOURS OVERDUE)
-- 24 hours without a recovery answer: insert a normal-severity no_response alert for officers
CREATE OR REPLACE FUNCTION process_overdue_recovery_checks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
  v_doctor_id UUID;
BEGIN
  FOR r IN
    SELECT rc.id, rc.visit_id, rc.student_id
    FROM recovery_checks rc
    WHERE rc.answer IS NULL
      AND rc.created_at < (now() - INTERVAL '24 hours')
      AND NOT EXISTS (
        SELECT 1 FROM alerts a
        WHERE a.visit_id = rc.visit_id AND a.type = 'no_response'
      )
  LOOP
    SELECT doctor_id INTO v_doctor_id FROM visits WHERE id = r.visit_id;

    INSERT INTO alerts (
      visit_id,
      student_id,
      doctor_id,
      type,
      severity,
      status
    ) VALUES (
      r.visit_id,
      r.student_id,
      v_doctor_id,
      'no_response',
      'normal',
      'open'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 4. PG_CRON SCHEDULES
-- Schedule 1: Every morning at 06:00 AM IST (00:30 UTC): Mark yesterday's unanswered doses as unconfirmed
SELECT cron.schedule(
  'mark-unconfirmed-doses-daily',
  '30 0 * * *',
  $$SELECT process_unconfirmed_doses()$$
);

-- Schedule 2: Hourly: Check for recovery inquiries unanswered for >24 hours and trigger yellow alert for officers
SELECT cron.schedule(
  'check-overdue-recovery-hourly',
  '15 * * * *',
  $$SELECT process_overdue_recovery_checks()$$
);
