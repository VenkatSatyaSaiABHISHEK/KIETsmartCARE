-- ==============================================================================
-- KIET Smart Care - Row Level Security (RLS) & Medical Audit Triggers
-- Security Boundary: Strict role isolation across Admin, Doctor, Officer, Student
-- ==============================================================================

-- 1. HELPER FUNCTIONS TO QUERY CALLER IDENTITY & ROLE
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM students WHERE profile_id = auth.uid();
$$;

-- 2. ENABLE ROW LEVEL SECURITY ON EVERY TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_meal_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. PERMANENT MEDICAL HISTORY INVARIANT TRIGGER
-- Clinical visits and prescribed medications cannot be modified or deleted post-submission.
CREATE OR REPLACE FUNCTION prevent_medical_record_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Medical Record Invariant: Submitted clinical consultation and prescription records are permanent and immutable.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_visits ON visits;
CREATE TRIGGER trg_immutable_visits
BEFORE UPDATE OR DELETE ON visits
FOR EACH ROW EXECUTE FUNCTION prevent_medical_record_modification();

DROP TRIGGER IF EXISTS trg_immutable_visit_medications ON visit_medications;
CREATE TRIGGER trg_immutable_visit_medications
BEFORE UPDATE OR DELETE ON visit_medications
FOR EACH ROW EXECUTE FUNCTION prevent_medical_record_modification();

-- 4. MEDICAL AUDIT LOG TRIGGER
CREATE OR REPLACE FUNCTION audit_medical_table_event()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
BEGIN
  v_actor := auth.uid();
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata
  ) VALUES (
    v_actor,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'op', TG_OP,
      'timestamp', now(),
      'table', TG_TABLE_NAME
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_visits ON visits;
CREATE TRIGGER trg_audit_visits
AFTER INSERT ON visits
FOR EACH ROW EXECUTE FUNCTION audit_medical_table_event();

DROP TRIGGER IF EXISTS trg_audit_visit_medications ON visit_medications;
CREATE TRIGGER trg_audit_visit_medications
AFTER INSERT ON visit_medications
FOR EACH ROW EXECUTE FUNCTION audit_medical_table_event();

DROP TRIGGER IF EXISTS trg_audit_recovery_checks ON recovery_checks;
CREATE TRIGGER trg_audit_recovery_checks
AFTER INSERT OR UPDATE ON recovery_checks
FOR EACH ROW EXECUTE FUNCTION audit_medical_table_event();

DROP TRIGGER IF EXISTS trg_audit_alerts ON alerts;
CREATE TRIGGER trg_audit_alerts
AFTER INSERT OR UPDATE ON alerts
FOR EACH ROW EXECUTE FUNCTION audit_medical_table_event();

DROP TRIGGER IF EXISTS trg_audit_call_logs ON call_logs;
CREATE TRIGGER trg_audit_call_logs
AFTER INSERT ON call_logs
FOR EACH ROW EXECUTE FUNCTION audit_medical_table_event();

-- ==============================================================================
-- 5. RLS POLICIES FOR EACH TABLE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Admin: Full access
CREATE POLICY admin_profiles_all ON profiles
FOR ALL TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Users read their own profile
CREATE POLICY users_read_own_profile ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Users update their own profile (phone, full_name)
CREATE POLICY users_update_own_profile ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Staff members (doctor/officer) can read other staff and student profiles
CREATE POLICY staff_read_profiles ON profiles
FOR SELECT TO authenticated
USING (get_current_user_role() IN ('doctor', 'officer'));

-- ------------------------------------------------------------------------------
-- STUDENTS POLICIES
-- ------------------------------------------------------------------------------
-- Admin: Full access
CREATE POLICY admin_students_all ON students
FOR ALL TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Doctor: Read students (for roll lookup and patient info)
CREATE POLICY doctor_students_read ON students
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

-- Officer: Read students (for triage & outreach)
CREATE POLICY officer_students_read ON students
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

-- Student: Read own record
CREATE POLICY student_read_own_record ON students
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

-- Student: Update own non-credential details (phone, emergency_contact)
CREATE POLICY student_update_own_record ON students
FOR UPDATE TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- ------------------------------------------------------------------------------
-- STUDENT MEAL TIMES POLICIES
-- ------------------------------------------------------------------------------
-- Admin: Full access
CREATE POLICY admin_meal_times_all ON student_meal_times
FOR ALL TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Doctor: Read meal times for prescriptions
CREATE POLICY doctor_meal_times_read ON student_meal_times
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

-- Student: Read and update own meal times
CREATE POLICY student_meal_times_read ON student_meal_times
FOR SELECT TO authenticated
USING (student_id = get_current_student_id());

CREATE POLICY student_meal_times_update ON student_meal_times
FOR UPDATE TO authenticated
USING (student_id = get_current_student_id())
WITH CHECK (student_id = get_current_student_id());

CREATE POLICY student_meal_times_insert ON student_meal_times
FOR INSERT TO authenticated
WITH CHECK (student_id = get_current_student_id());

-- ------------------------------------------------------------------------------
-- MEDICINES POLICIES
-- ------------------------------------------------------------------------------
-- Admin: Full management
CREATE POLICY admin_medicines_all ON medicines
FOR ALL TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Doctor, Officer, Student: Read active medicines
CREATE POLICY staff_students_medicines_read ON medicines
FOR SELECT TO authenticated
USING (active = true);

-- ------------------------------------------------------------------------------
-- VISITS POLICIES
-- Invariant: Admin has ZERO access to clinical visits
-- ------------------------------------------------------------------------------
-- Doctor: Insert visits and read visits
CREATE POLICY doctor_visits_insert ON visits
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'doctor' AND
  doctor_id = auth.uid()
);

CREATE POLICY doctor_visits_read ON visits
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

-- Officer: Read-only visits summaries (problem_category and status)
CREATE POLICY officer_visits_read ON visits
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

-- Student: Read own visits
CREATE POLICY student_visits_read ON visits
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

-- ------------------------------------------------------------------------------
-- VISIT MEDICATIONS POLICIES
-- Invariant: Admin has ZERO access
-- ------------------------------------------------------------------------------
CREATE POLICY doctor_visit_medications_insert ON visit_medications
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'doctor' AND
  EXISTS (SELECT 1 FROM visits WHERE visits.id = visit_id AND visits.doctor_id = auth.uid())
);

CREATE POLICY doctor_visit_medications_read ON visit_medications
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

CREATE POLICY officer_visit_medications_read ON visit_medications
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

CREATE POLICY student_visit_medications_read ON visit_medications
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  EXISTS (SELECT 1 FROM visits WHERE visits.id = visit_medications.visit_id AND visits.student_id = get_current_student_id())
);

-- ------------------------------------------------------------------------------
-- DOSE SCHEDULE POLICIES
-- Invariant: Admin has ZERO access
-- ------------------------------------------------------------------------------
CREATE POLICY doctor_dose_schedule_read ON dose_schedule
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'doctor' AND
  EXISTS (
    SELECT 1 FROM visit_medications vm
    JOIN visits v ON v.id = vm.visit_id
    WHERE vm.id = dose_schedule.visit_medication_id AND v.doctor_id = auth.uid()
  )
);

CREATE POLICY officer_dose_schedule_read ON dose_schedule
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

CREATE POLICY student_dose_schedule_read ON dose_schedule
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

-- ------------------------------------------------------------------------------
-- DOSE EVENTS POLICIES
-- Invariant: Admin has ZERO access
-- ------------------------------------------------------------------------------
CREATE POLICY student_dose_events_insert ON dose_events
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY student_dose_events_read ON dose_events
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY doctor_dose_events_read ON dose_events
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

CREATE POLICY officer_dose_events_read ON dose_events
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

-- ------------------------------------------------------------------------------
-- RECOVERY CHECKS POLICIES
-- Invariant: Admin has ZERO access
-- ------------------------------------------------------------------------------
CREATE POLICY student_recovery_checks_insert ON recovery_checks
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY student_recovery_checks_update ON recovery_checks
FOR UPDATE TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
)
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY student_recovery_checks_read ON recovery_checks
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY doctor_recovery_checks_read ON recovery_checks
FOR SELECT TO authenticated
USING (get_current_user_role() = 'doctor');

CREATE POLICY officer_recovery_checks_read ON recovery_checks
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

-- ------------------------------------------------------------------------------
-- ALERTS POLICIES
-- Invariant: Admin has ZERO access
-- ------------------------------------------------------------------------------
CREATE POLICY doctor_alerts_read ON alerts
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'doctor' AND
  doctor_id = auth.uid()
);

CREATE POLICY doctor_alerts_update ON alerts
FOR UPDATE TO authenticated
USING (
  get_current_user_role() = 'doctor' AND
  doctor_id = auth.uid()
)
WITH CHECK (
  get_current_user_role() = 'doctor' AND
  doctor_id = auth.uid()
);

CREATE POLICY officer_alerts_read ON alerts
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

CREATE POLICY officer_alerts_update ON alerts
FOR UPDATE TO authenticated
USING (get_current_user_role() = 'officer')
WITH CHECK (get_current_user_role() = 'officer');

CREATE POLICY student_alerts_insert ON alerts
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY student_alerts_read ON alerts
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

-- ------------------------------------------------------------------------------
-- CALL LOGS POLICIES
-- Invariant: Admin has ZERO access; Doctor CANNOT edit or insert officer call_logs
-- ------------------------------------------------------------------------------
CREATE POLICY officer_call_logs_insert ON call_logs
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'officer' AND
  officer_id = auth.uid()
);

CREATE POLICY officer_call_logs_read ON call_logs
FOR SELECT TO authenticated
USING (get_current_user_role() = 'officer');

-- ------------------------------------------------------------------------------
-- DEVICES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY student_devices_manage ON devices
FOR ALL TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
)
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

-- ------------------------------------------------------------------------------
-- CONSENT RECORDS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY student_consent_records_insert ON consent_records
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY student_consent_records_read ON consent_records
FOR SELECT TO authenticated
USING (
  get_current_user_role() = 'student' AND
  student_id = get_current_student_id()
);

CREATE POLICY admin_consent_records_read ON consent_records
FOR SELECT TO authenticated
USING (get_current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- Invariant: Admin full read access
-- ------------------------------------------------------------------------------
CREATE POLICY admin_audit_logs_read ON audit_logs
FOR SELECT TO authenticated
USING (get_current_user_role() = 'admin');
