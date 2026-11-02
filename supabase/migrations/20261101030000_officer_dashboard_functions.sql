-- ==============================================================================
-- Migration: 20261101030000_officer_dashboard_functions.sql
-- Officer Dashboard & Student Roster Security Definer Functions & Problem Aliases
-- ==============================================================================

-- 1. PROBLEM ALIASES TABLE
CREATE TABLE IF NOT EXISTS public.problem_aliases (
  alias TEXT PRIMARY KEY,
  canonical TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed common clinical problem aliases
INSERT INTO public.problem_aliases (alias, canonical) VALUES
  ('headache', 'Headache'),
  ('head ache', 'Headache'),
  ('migraine', 'Headache'),
  ('severe headache', 'Headache'),
  ('fever', 'Acute Viral Illness'),
  ('viral fever', 'Acute Viral Illness'),
  ('high fever', 'Acute Viral Illness'),
  ('acute viral illness', 'Acute Viral Illness'),
  ('fever and body ache', 'Acute Viral Illness'),
  ('pyrexia', 'Acute Viral Illness'),
  ('cold', 'Cold & Cough Congestion'),
  ('cough', 'Cold & Cough Congestion'),
  ('cold and cough', 'Cold & Cough Congestion'),
  ('cold & cough', 'Cold & Cough Congestion'),
  ('bronchial congestion', 'Cold & Cough Congestion'),
  ('nasal congestion', 'Cold & Cough Congestion'),
  ('throat irritation', 'Pharyngitis & Sore Throat'),
  ('sore throat', 'Pharyngitis & Sore Throat'),
  ('acidity', 'Acute Acidity & Gastritis'),
  ('gastric', 'Acute Acidity & Gastritis'),
  ('acute gastritis', 'Acute Acidity & Gastritis'),
  ('stomach issue', 'Acute Acidity & Gastritis'),
  ('stomach ache', 'Acute Acidity & Gastritis'),
  ('indigestion', 'Acute Acidity & Gastritis'),
  ('diarrhea', 'Acute Gastroenteritis'),
  ('loose motions', 'Acute Gastroenteritis'),
  ('food poisoning', 'Acute Gastroenteritis'),
  ('gastroenteritis', 'Acute Gastroenteritis'),
  ('sprain', 'Physical Injury / Sprain'),
  ('injury', 'Physical Injury / Sprain'),
  ('muscle pain', 'Physical Injury / Sprain'),
  ('wound', 'Physical Injury / Sprain')
ON CONFLICT (alias) DO UPDATE SET canonical = EXCLUDED.canonical;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits (visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_student_id ON public.visits (student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status_created ON public.alerts (status, created_at);
CREATE INDEX IF NOT EXISTS idx_dose_schedule_scheduled ON public.dose_schedule (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dose_events_schedule ON public.dose_events (schedule_id);

-- 2. HELPER FUNCTION: NORMALIZE PROBLEM CATEGORY
CREATE OR REPLACE FUNCTION public.normalize_problem_category(raw_problem TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_clean TEXT;
  v_canonical TEXT;
BEGIN
  IF raw_problem IS NULL OR trim(raw_problem) = '' THEN
    RETURN 'General Consultation';
  END IF;

  v_clean := lower(trim(raw_problem));

  SELECT canonical INTO v_canonical
  FROM public.problem_aliases
  WHERE alias = v_clean
  LIMIT 1;

  IF v_canonical IS NOT NULL THEN
    RETURN v_canonical;
  END IF;

  -- Default: Title-case formatted original
  RETURN initcap(trim(raw_problem));
END;
$$;

-- 3. OFFICER DASHBOARD FUNCTION (SECURITY DEFINER)
-- Checks caller is officer; returns single aggregate JSON; Asia/Kolkata timezone
CREATE OR REPLACE FUNCTION public.officer_dashboard(
  anchor_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
  period TEXT DEFAULT 'today'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_anchor DATE;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_now_ist TIMESTAMPTZ;
  
  -- Result JSON pieces
  v_open_red_alerts INT := 0;
  v_no_response_alerts INT := 0;
  v_active_treatments INT := 0;
  v_doses_confirmed INT := 0;
  v_doses_due INT := 0;
  v_students_seen INT := 0;
  v_recovered INT := 0;
  v_not_recovered INT := 0;
  
  v_last_7_days JSONB := '[]'::JSONB;
  v_common_problems JSONB := '[]'::JSONB;
  v_common_start DATE;
  v_common_end DATE;
  v_widened BOOLEAN := false;
  v_needs_call JSONB := '[]'::JSONB;
  v_open_alert_count INT := 0;
BEGIN
  -- Authenticate caller role: Officer ONLY (reject doctor & admin)
  IF auth.uid() IS NOT NULL THEN
    SELECT role::TEXT INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_role IS NULL THEN
      SELECT role::TEXT INTO v_caller_role
      FROM public.access_credentials
      WHERE id = auth.uid() AND is_active = true;
    END IF;

    IF v_caller_role IS NULL OR v_caller_role != 'officer' THEN
      RAISE EXCEPTION 'Access denied: Only Campus Health Officers may access the surveillance dashboard.';
    END IF;
  END IF;

  v_anchor := COALESCE(anchor_date, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE);
  v_now_ist := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';

  -- Calculate Period Start and End in Asia/Kolkata timezone
  IF period = '7d' THEN
    v_period_start := (v_anchor - INTERVAL '6 days')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  ELSIF period = '30d' THEN
    v_period_start := (v_anchor - INTERVAL '29 days')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  ELSE
    -- 'today'
    v_period_start := v_anchor::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  END IF;
  v_period_end := ((v_anchor + INTERVAL '1 day')::TIMESTAMP - INTERVAL '1 millisecond') AT TIME ZONE 'Asia/Kolkata';

  -- 1. NEEDS ACTION (Right now, not period bound)
  SELECT COUNT(*) INTO v_open_red_alerts
  FROM public.alerts
  WHERE status IN ('open', 'in_progress') AND severity = 'red';

  SELECT COUNT(DISTINCT student_id) INTO v_no_response_alerts
  FROM public.alerts
  WHERE status IN ('open', 'in_progress') AND type = 'no_response';

  SELECT COUNT(*) INTO v_open_alert_count
  FROM public.alerts
  WHERE status IN ('open', 'in_progress');

  -- 2. UNDER TREATMENT (Active visits right now)
  SELECT COUNT(*) INTO v_active_treatments
  FROM public.visits
  WHERE status = 'active';

  -- Doses in this period scheduled up to right now
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE de.response IN ('taken', 'taken_late'))
  INTO v_doses_due, v_doses_confirmed
  FROM public.dose_schedule ds
  LEFT JOIN public.dose_events de ON de.schedule_id = ds.id
  WHERE ds.scheduled_at >= v_period_start 
    AND ds.scheduled_at <= LEAST(v_period_end, CURRENT_TIMESTAMP);

  -- 3. THIS PERIOD
  SELECT 
    COUNT(DISTINCT student_id),
    COUNT(*) FILTER (WHERE status = 'recovered'),
    COUNT(*) FILTER (WHERE status = 'not_recovered')
  INTO v_students_seen, v_recovered, v_not_recovered
  FROM public.visits
  WHERE visit_date >= v_period_start AND visit_date <= v_period_end;

  -- 4. LAST 7 DAYS (Ending at anchor_date, Asia/Kolkata days)
  WITH day_series AS (
    SELECT (v_anchor - (6 - i))::DATE AS day_date
    FROM generate_series(0, 6) AS i
  ),
  day_counts AS (
    SELECT 
      (v.visit_date AT TIME ZONE 'Asia/Kolkata')::DATE AS visit_day,
      COUNT(DISTINCT v.student_id) AS student_count
    FROM public.visits v
    WHERE v.visit_date >= ((v_anchor - INTERVAL '6 days')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND v.visit_date <= (((v_anchor + INTERVAL '1 day')::TIMESTAMP - INTERVAL '1 millisecond') AT TIME ZONE 'Asia/Kolkata')
    GROUP BY (v.visit_date AT TIME ZONE 'Asia/Kolkata')::DATE
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.day_date::TEXT,
      'weekday', to_char(ds.day_date, 'Dy'),
      'day_number', to_char(ds.day_date, 'FMDD Mon'),
      'students_seen', COALESCE(dc.student_count, 0),
      'is_anchor', (ds.day_date = v_anchor)
    ) ORDER BY ds.day_date ASC
  ) INTO v_last_7_days
  FROM day_series ds
  LEFT JOIN day_counts dc ON dc.visit_day = ds.day_date;

  -- 5. COMMON PROBLEMS (Top 5 categories with auto-widening rules)
  -- Default window: 7 days or 30 days based on period
  IF period = '30d' THEN
    v_common_start := (v_anchor - INTERVAL '29 days')::DATE;
  ELSE
    v_common_start := (v_anchor - INTERVAL '6 days')::DATE;
  END IF;
  v_common_end := v_anchor;

  -- Try initial window
  SELECT jsonb_agg(item) INTO v_common_problems
  FROM (
    SELECT jsonb_build_object(
      'category', public.normalize_problem_category(v.problem_category),
      'count', COUNT(*)
    ) AS item
    FROM public.visits v
    WHERE (v.visit_date AT TIME ZONE 'Asia/Kolkata')::DATE BETWEEN v_common_start AND v_common_end
    GROUP BY public.normalize_problem_category(v.problem_category)
    ORDER BY COUNT(*) DESC, public.normalize_problem_category(v.problem_category) ASC
    LIMIT 5
  ) sub;

  -- If empty, widen to 30 days
  IF v_common_problems IS NULL OR jsonb_array_length(v_common_problems) = 0 THEN
    v_common_start := (v_anchor - INTERVAL '29 days')::DATE;
    v_widened := true;

    SELECT jsonb_agg(item) INTO v_common_problems
    FROM (
      SELECT jsonb_build_object(
        'category', public.normalize_problem_category(v.problem_category),
        'count', COUNT(*)
      ) AS item
      FROM public.visits v
      WHERE (v.visit_date AT TIME ZONE 'Asia/Kolkata')::DATE BETWEEN v_common_start AND v_common_end
      GROUP BY public.normalize_problem_category(v.problem_category)
      ORDER BY COUNT(*) DESC, public.normalize_problem_category(v.problem_category) ASC
      LIMIT 5
    ) sub;
  END IF;

  -- If still empty, widen to all time
  IF v_common_problems IS NULL OR jsonb_array_length(v_common_problems) = 0 THEN
    v_common_start := '2020-01-01'::DATE;
    v_widened := true;

    SELECT jsonb_agg(item) INTO v_common_problems
    FROM (
      SELECT jsonb_build_object(
        'category', public.normalize_problem_category(v.problem_category),
        'count', COUNT(*)
      ) AS item
      FROM public.visits v
      GROUP BY public.normalize_problem_category(v.problem_category)
      ORDER BY COUNT(*) DESC, public.normalize_problem_category(v.problem_category) ASC
      LIMIT 5
    ) sub;
  END IF;

  IF v_common_problems IS NULL THEN
    v_common_problems := '[]'::JSONB;
  END IF;

  -- 6. NEEDS A CALL NOW (Open alerts sorted longest waiting first)
  SELECT jsonb_agg(item) INTO v_needs_call
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'student_id', s.id,
      'student_name', s.name,
      'roll_number', s.roll_number,
      'branch', s.branch,
      'phone', s.phone,
      'reason', a.type,
      'severity', a.severity,
      'created_at', a.created_at
    ) AS item
    FROM public.alerts a
    JOIN public.students s ON s.id = a.student_id
    WHERE a.status IN ('open', 'in_progress')
    ORDER BY a.created_at ASC
  ) sub;

  IF v_needs_call IS NULL THEN
    v_needs_call := '[]'::JSONB;
  END IF;

  -- Return complete cohesive dashboard object
  RETURN jsonb_build_object(
    'anchor_date', v_anchor::TEXT,
    'period', period,
    'period_start', v_period_start,
    'period_end', v_period_end,
    'needs_action', jsonb_build_object(
      'open_alerts', v_open_red_alerts,
      'no_response', v_no_response_alerts
    ),
    'under_treatment', jsonb_build_object(
      'active', v_active_treatments,
      'doses_confirmed', v_doses_confirmed,
      'doses_due', v_doses_due
    ),
    'this_period', jsonb_build_object(
      'students_seen', v_students_seen,
      'recovered', v_recovered,
      'not_recovered', v_not_recovered
    ),
    'last_7_days', v_last_7_days,
    'common_problems', jsonb_build_object(
      'start_date', v_common_start::TEXT,
      'end_date', v_common_end::TEXT,
      'widened', v_widened,
      'items', v_common_problems
    ),
    'needs_call', v_needs_call,
    'open_alert_count', v_open_alert_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_dashboard(DATE, TEXT) TO authenticated, service_role;

-- 4. OFFICER STUDENTS FUNCTION (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.officer_students(
  anchor_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
  period TEXT DEFAULT 'today',
  p_tab TEXT DEFAULT 'all',
  p_search TEXT DEFAULT '',
  p_cursor TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_anchor DATE;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_clean_search TEXT;
  
  v_count_all INT := 0;
  v_count_needs_attention INT := 0;
  v_count_active INT := 0;
  v_count_recovered INT := 0;
  v_students JSONB := '[]'::JSONB;
BEGIN
  -- Authenticate caller role: Officer ONLY
  IF auth.uid() IS NOT NULL THEN
    SELECT role::TEXT INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_role IS NULL THEN
      SELECT role::TEXT INTO v_caller_role
      FROM public.access_credentials
      WHERE id = auth.uid() AND is_active = true;
    END IF;

    IF v_caller_role IS NULL OR v_caller_role != 'officer' THEN
      RAISE EXCEPTION 'Access denied: Only Campus Health Officers may access student surveillance records.';
    END IF;
  END IF;

  v_anchor := COALESCE(anchor_date, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE);
  v_clean_search := lower(trim(COALESCE(p_search, '')));

  IF period = '7d' THEN
    v_period_start := (v_anchor - INTERVAL '6 days')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  ELSIF period = '30d' THEN
    v_period_start := (v_anchor - INTERVAL '29 days')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  ELSE
    v_period_start := v_anchor::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  END IF;
  v_period_end := ((v_anchor + INTERVAL '1 day')::TIMESTAMP - INTERVAL '1 millisecond') AT TIME ZONE 'Asia/Kolkata';

  -- Base subquery of students seen in this period with latest visit and open alert status
  WITH period_students AS (
    SELECT DISTINCT ON (s.id)
      s.id AS student_id,
      s.name,
      s.roll_number,
      s.branch,
      s.phone,
      v.id AS latest_visit_id,
      v.visit_date AS latest_visit_date,
      v.status AS visit_status,
      EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.student_id = s.id AND a.status IN ('open', 'in_progress')
      ) AS has_open_alert,
      EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.student_id = s.id AND a.status IN ('open', 'in_progress') AND a.type = 'no_response'
      ) AS has_no_response_alert
    FROM public.students s
    JOIN public.visits v ON v.student_id = s.id
    WHERE v.visit_date >= v_period_start AND v.visit_date <= v_period_end
    ORDER BY s.id, v.visit_date DESC
  ),
  classified AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.has_no_response_alert THEN 'No response'
        WHEN ps.has_open_alert THEN 'Needs attention'
        WHEN ps.visit_status = 'recovered' THEN 'Recovered'
        WHEN ps.visit_status = 'not_recovered' THEN 'Not recovered'
        ELSE 'Active treatment'
      END AS status_label
    FROM period_students ps
  )
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE has_open_alert = true),
    COUNT(*) FILTER (WHERE status_label = 'Active treatment'),
    COUNT(*) FILTER (WHERE status_label = 'Recovered')
  INTO v_count_all, v_count_needs_attention, v_count_active, v_count_recovered
  FROM classified;

  -- Filter for the requested tab and search query
  WITH period_students AS (
    SELECT DISTINCT ON (s.id)
      s.id AS student_id,
      s.name,
      s.roll_number,
      s.branch,
      s.phone,
      v.id AS latest_visit_id,
      v.visit_date AS latest_visit_date,
      v.status AS visit_status,
      EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.student_id = s.id AND a.status IN ('open', 'in_progress')
      ) AS has_open_alert,
      EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.student_id = s.id AND a.status IN ('open', 'in_progress') AND a.type = 'no_response'
      ) AS has_no_response_alert
    FROM public.students s
    JOIN public.visits v ON v.student_id = s.id
    WHERE v.visit_date >= v_period_start AND v.visit_date <= v_period_end
    ORDER BY s.id, v.visit_date DESC
  ),
  classified AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.has_no_response_alert THEN 'No response'
        WHEN ps.has_open_alert THEN 'Needs attention'
        WHEN ps.visit_status = 'recovered' THEN 'Recovered'
        WHEN ps.visit_status = 'not_recovered' THEN 'Not recovered'
        ELSE 'Active treatment'
      END AS status_label
    FROM period_students ps
  ),
  filtered AS (
    SELECT *
    FROM classified c
    WHERE 
      (p_tab = 'all' OR 
       (p_tab = 'needs_attention' AND c.has_open_alert) OR
       (p_tab = 'active' AND c.status_label = 'Active treatment') OR
       (p_tab = 'recovered' AND c.status_label = 'Recovered'))
      AND
      (v_clean_search = '' OR 
       lower(c.name) LIKE '%' || v_clean_search || '%' OR
       lower(c.roll_number) LIKE '%' || v_clean_search || '%')
    ORDER BY c.latest_visit_date DESC
    LIMIT p_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', f.student_id,
      'name', f.name,
      'roll_number', f.roll_number,
      'branch', f.branch,
      'phone', f.phone,
      'current_status', f.status_label,
      'last_visit_date', f.latest_visit_date,
      'has_open_alert', f.has_open_alert
    )
  ) INTO v_students
  FROM filtered f;

  IF v_students IS NULL THEN
    v_students := '[]'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'counts', jsonb_build_object(
      'all', v_count_all,
      'needs_attention', v_count_needs_attention,
      'active', v_count_active,
      'recovered', v_count_recovered
    ),
    'students', v_students
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_students(DATE, TEXT, TEXT, TEXT, TEXT, INT) TO authenticated, service_role;

