-- ==============================================================================
-- KIET SMART CARE - COMPLETE DATABASE SCHEMA, RLS, FUNCTIONS & SEED DATA
-- Run this entire file in your Supabase Dashboard SQL Editor
-- Project: https://kfvquhtylkhzenuvdmdz.supabase.co
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031000000_schema_architecture.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- KIET Smart Care - Core Database Schema
-- Architecture: PostgreSQL on Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'officer', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE profile_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE student_status AS ENUM ('active', 'graduated', 'suspended', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('active', 'recovered', 'not_recovered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE meal_relation_enum AS ENUM ('before', 'after');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE dose_slot AS ENUM ('breakfast', 'lunch', 'dinner');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE dose_response AS ENUM ('taken', 'taken_late', 'not_taken', 'unconfirmed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE recovery_answer AS ENUM ('better', 'same', 'worse');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('worse', 'same', 'side_effect', 'no_response');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('red', 'normal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE call_outcome AS ENUM ('reached', 'unreachable', 'call_back_requested', 'emergency_escalated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES

-- profiles: Linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  status profile_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- students: Institutional student entity
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
  phone TEXT,
  photo_path TEXT,
  allergies TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  emergency_contact TEXT,
  status student_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- student_meal_times: Personalized meal schedule
CREATE TABLE IF NOT EXISTS student_meal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  breakfast TIME NOT NULL DEFAULT '08:00:00',
  lunch TIME NOT NULL DEFAULT '13:00:00',
  dinner TIME NOT NULL DEFAULT '20:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- medicines: Institutional formulary / catalog
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_form TEXT NOT NULL DEFAULT 'tablet',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- visits: Doctor OPD clinical consultation record
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  problem_category TEXT NOT NULL,
  notes TEXT,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  follow_up_date TIMESTAMPTZ,
  status visit_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- visit_medications: Structured prescription line items
CREATE TABLE IF NOT EXISTS visit_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id),
  dose TEXT NOT NULL,
  times_per_day INT NOT NULL CHECK (times_per_day BETWEEN 1 AND 4),
  meal_relation meal_relation_enum NOT NULL DEFAULT 'after',
  days INT NOT NULL CHECK (days > 0),
  quantity_handed_over INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- dose_schedule: Individual scheduled doses computed from meal times
CREATE TABLE IF NOT EXISTS dose_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_medication_id UUID NOT NULL REFERENCES visit_medications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  slot dose_slot NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- dose_events: Adherence logs (taken, late, missed, unconfirmed)
CREATE TABLE IF NOT EXISTS dose_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES dose_schedule(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  response dose_response NOT NULL,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- recovery_checks: 1-tap post-course recovery inquiries
CREATE TABLE IF NOT EXISTS recovery_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  answer recovery_answer,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- alerts: Clinical escalation alerts (red / normal)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id),
  student_id UUID NOT NULL REFERENCES students(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'normal',
  status alert_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- call_logs: Health Officer telephonic outreach records
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES profiles(id),
  outcome call_outcome NOT NULL,
  notes TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- devices: Student Expo push notification tokens
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform device_platform NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_device UNIQUE(student_id, expo_push_token)
);

-- consent_records: Student medical telemetry consent audit
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL DEFAULT 'Campus clinic medical adherence and recovery monitoring',
  status consent_status NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- audit_logs: System immutable audit ledger
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_student_meal_times_updated_at ON student_meal_times;
CREATE TRIGGER trg_student_meal_times_updated_at BEFORE UPDATE ON student_meal_times FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_medicines_updated_at ON medicines;
CREATE TRIGGER trg_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_visits_updated_at ON visits;
CREATE TRIGGER trg_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_visit_medications_updated_at ON visit_medications;
CREATE TRIGGER trg_visit_medications_updated_at BEFORE UPDATE ON visit_medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_dose_schedule_updated_at ON dose_schedule;
CREATE TRIGGER trg_dose_schedule_updated_at BEFORE UPDATE ON dose_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_dose_events_updated_at ON dose_events;
CREATE TRIGGER trg_dose_events_updated_at BEFORE UPDATE ON dose_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_recovery_checks_updated_at ON recovery_checks;
CREATE TRIGGER trg_recovery_checks_updated_at BEFORE UPDATE ON recovery_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON alerts;
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_call_logs_updated_at ON call_logs;
CREATE TRIGGER trg_call_logs_updated_at BEFORE UPDATE ON call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_devices_updated_at ON devices;
CREATE TRIGGER trg_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_consent_records_updated_at ON consent_records;
CREATE TRIGGER trg_consent_records_updated_at BEFORE UPDATE ON consent_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. INDEXES ON EVERY FOREIGN KEY
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_meal_times_student_id ON student_meal_times(student_id);
CREATE INDEX IF NOT EXISTS idx_visits_student_id ON visits(student_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_visit_id ON visit_medications(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_medicine_id ON visit_medications(medicine_id);
CREATE INDEX IF NOT EXISTS idx_dose_schedule_visit_medication_id ON dose_schedule(visit_medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_schedule_student_id ON dose_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_schedule_id ON dose_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_student_id ON dose_events(student_id);
CREATE INDEX IF NOT EXISTS idx_recovery_checks_visit_id ON recovery_checks(visit_id);
CREATE INDEX IF NOT EXISTS idx_recovery_checks_student_id ON recovery_checks(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_visit_id ON alerts(visit_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student_id ON alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_doctor_id ON alerts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_by ON alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_alert_id ON call_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_officer_id ON call_logs(officer_id);
CREATE INDEX IF NOT EXISTS idx_devices_student_id ON devices(student_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_student_id ON consent_records(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- 7. INDEXES ON roll_number, status, AND scheduled_at
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_dose_schedule_scheduled_at ON dose_schedule(scheduled_at);


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031010000_authorization_and_rls.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031020000_dose_schedule_and_alert_triggers.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031030000_scheduled_jobs_and_pg_cron.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031040000_storage_and_realtime.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- KIET Smart Care - Private Storage Buckets, Policies & Realtime Publication
-- ==============================================================================

-- 1. PROVISION PRIVATE STORAGE BUCKETS (NEVER PUBLIC)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'student-photos',
    'student-photos',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'medical-documents',
    'medical-documents',
    false,
    20971520, -- 20MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE POLICIES (storage.objects)

-- ------------------------------------------------------------------------------
-- BUCKET: student-photos
-- ------------------------------------------------------------------------------
CREATE POLICY "student_photos_read_staff_and_self"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-photos' AND (
    get_current_user_role() IN ('admin', 'doctor', 'officer') OR
    (get_current_user_role() = 'student' AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

CREATE POLICY "student_photos_write_admin_and_self"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-photos' AND (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'student' AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

CREATE POLICY "student_photos_update_admin_and_self"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-photos' AND (
    get_current_user_role() = 'admin' OR
    (get_current_user_role() = 'student' AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- ------------------------------------------------------------------------------
-- BUCKET: medical-documents
-- Invariant: Admin is strictly prohibited from viewing medical documents
-- ------------------------------------------------------------------------------
CREATE POLICY "medical_documents_doctor_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  get_current_user_role() = 'doctor'
);

CREATE POLICY "medical_documents_doctor_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  get_current_user_role() = 'doctor'
);

CREATE POLICY "medical_documents_student_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  get_current_user_role() = 'student' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. ENABLE SUPABASE REALTIME ON ALERTS
-- Realtime streaming for Doctor and Officer portals
ALTER TABLE alerts REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261031050000_prescription_redesign.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- KIET Smart Care - Doctor Prescription Redesign Migration
-- Supports dose-centric clinical workflow, explicit planned timelines,
-- tablets_per_dose, total_doses, and flexible dose slots.
-- ==============================================================================

-- 1. EXTEND DOSE_SLOT ENUM FOR CLINICAL CLOCK SLOTS
DO $$ BEGIN
  ALTER TYPE dose_slot ADD VALUE IF NOT EXISTS 'morning';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE dose_slot ADD VALUE IF NOT EXISTS 'afternoon';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE dose_slot ADD VALUE IF NOT EXISTS 'evening';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE dose_slot ADD VALUE IF NOT EXISTS 'night';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ALTER VISIT_MEDICATIONS TABLE FOR DOSE-CENTRIC METRICS
ALTER TABLE visit_medications
  ADD COLUMN IF NOT EXISTS tablets_per_dose INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_doses INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS planned_slots JSONB DEFAULT '[]'::jsonb;

-- Relax days constraint if older column exists
ALTER TABLE visit_medications
  ALTER COLUMN days DROP NOT NULL;

-- 3. ENHANCE DOSE_SCHEDULE TABLE
ALTER TABLE dose_schedule
  ADD COLUMN IF NOT EXISTS tablets INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS meal_relation meal_relation_enum DEFAULT 'after';

-- 4. ATOMIC DOSE GENERATION PROCEDURE & TRIGGER (BACKWARD-COMPATIBLE & DOSE-CENTRIC)
CREATE OR REPLACE FUNCTION generate_dose_schedules_on_medication_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_visit_date TIMESTAMPTZ;
  v_planned_item JSONB;
  v_slot_name TEXT;
  v_scheduled_at TIMESTAMPTZ;
  v_meal_rel meal_relation_enum;
  v_tablets INT;
  v_slot_enum dose_slot;
BEGIN
  -- 1. Fetch visit details
  SELECT student_id, visit_date INTO v_student_id, v_visit_date
  FROM visits
  WHERE id = NEW.visit_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Associated visit not found for medication schedule generation.';
  END IF;

  -- 2. Check if explicit planned_slots was supplied by the doctor interface
  IF NEW.planned_slots IS NOT NULL AND jsonb_array_length(NEW.planned_slots) > 0 THEN
    -- Generate explicit doses exactly as prescribed by doctor
    FOR v_planned_item IN SELECT * FROM jsonb_array_elements(NEW.planned_slots) LOOP
      v_slot_name := lower(COALESCE(v_planned_item->>'slot_name', 'morning'));
      v_scheduled_at := (v_planned_item->>'scheduled_at')::TIMESTAMPTZ;
      v_meal_rel := COALESCE(v_planned_item->>'meal_relation', 'after')::meal_relation_enum;
      v_tablets := COALESCE((v_planned_item->>'tablets')::INT, NEW.tablets_per_dose, 1);

      -- Map slot name to enum
      IF v_slot_name IN ('morning', 'afternoon', 'evening', 'night') THEN
        v_slot_enum := v_slot_name::dose_slot;
      ELSIF v_slot_name = 'breakfast' THEN
        v_slot_enum := 'morning'::dose_slot;
      ELSIF v_slot_name = 'lunch' THEN
        v_slot_enum := 'afternoon'::dose_slot;
      ELSIF v_slot_name = 'dinner' THEN
        v_slot_enum := 'night'::dose_slot;
      ELSE
        v_slot_enum := 'morning'::dose_slot;
      END IF;

      INSERT INTO dose_schedule (
        visit_medication_id,
        student_id,
        scheduled_at,
        slot,
        tablets,
        meal_relation
      ) VALUES (
        NEW.id,
        v_student_id,
        v_scheduled_at,
        v_slot_enum,
        v_tablets,
        v_meal_rel
      );
    END LOOP;
  END IF;

  -- 3. Ensure recovery check entry exists for the visit (due day after last dose)
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

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_generate_dose_schedules ON visit_medications;
CREATE TRIGGER trg_generate_dose_schedules
AFTER INSERT ON visit_medications
FOR EACH ROW EXECUTE FUNCTION generate_dose_schedules_on_medication_insert();

-- 5. ENSURE RLS POLICIES FOR DOCTOR DIRECT DOSE SCHEDULE INSERTION
DROP POLICY IF EXISTS doctor_dose_schedule_insert ON dose_schedule;
CREATE POLICY doctor_dose_schedule_insert ON dose_schedule
FOR INSERT TO authenticated
WITH CHECK (
  get_current_user_role() = 'doctor' AND
  EXISTS (
    SELECT 1 FROM visit_medications vm
    JOIN visits v ON v.id = vm.visit_id
    WHERE vm.id = dose_schedule.visit_medication_id AND v.doctor_id = auth.uid()
  )
);


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261101000000_ui_redesign_data_model.sql
-- ------------------------------------------------------------------------------

-- KIET Smart Care - UI Redesign Data Model Update
-- visit_medications: max 4 per visit, tablets_per_dose 1-3, total_doses 1-7
-- dose_schedule: generated from explicit planned_slots array from doctor UI

-- Ensure constraints match new UI model
ALTER TABLE visit_medications
  DROP CONSTRAINT IF EXISTS visit_medications_times_per_day_check,
  DROP CONSTRAINT IF EXISTS visit_medications_days_check;

-- Add new constraints if not existing
ALTER TABLE visit_medications
  ADD COLUMN IF NOT EXISTS tablets_per_dose INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_doses INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS planned_slots JSONB DEFAULT '[]'::jsonb;

ALTER TABLE visit_medications
  DROP CONSTRAINT IF EXISTS vm_tablets_per_dose_check;
ALTER TABLE visit_medications
  ADD CONSTRAINT vm_tablets_per_dose_check CHECK (tablets_per_dose BETWEEN 1 AND 3);

ALTER TABLE visit_medications
  DROP CONSTRAINT IF EXISTS vm_total_doses_check;
ALTER TABLE visit_medications
  ADD CONSTRAINT vm_total_doses_check CHECK (total_doses BETWEEN 1 AND 7);

-- max 4 medications per visit - enforce via trigger
CREATE OR REPLACE FUNCTION enforce_max_medications_per_visit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM visit_medications WHERE visit_id = NEW.visit_id;
  IF v_count >= 4 THEN
    RAISE EXCEPTION 'A visit may have a maximum of 4 medications.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_max_medications ON visit_medications;
CREATE TRIGGER trg_max_medications
BEFORE INSERT ON visit_medications
FOR EACH ROW EXECUTE FUNCTION enforce_max_medications_per_visit();

-- Update dose_schedule to support grouping
ALTER TABLE dose_schedule
  ADD COLUMN IF NOT EXISTS group_key TEXT; -- e.g. "2026-11-01T08:00:00Z" for grouping concurrent doses

COMMENT ON COLUMN dose_schedule.group_key IS 'Doses sharing the same group_key fire in one grouped notification';


-- ------------------------------------------------------------------------------
-- MIGRATION: 20261101010000_role_pin_authentication.sql
-- ------------------------------------------------------------------------------

-- ============================================================================
-- Migration: 20261101010000_role_pin_authentication.sql
-- Role-based PIN authentication, rate limiting, and access credential management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.access_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'officer', 'admin')),
    pin_hash TEXT NOT NULL,
    pin_length INTEGER NOT NULL CHECK (pin_length IN (5, 8)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'officer', 'admin')),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_access_credentials_role_active 
    ON public.access_credentials(role, is_active);

CREATE INDEX IF NOT EXISTS idx_login_attempts_rate_limit 
    ON public.login_attempts(ip_address, role, attempted_at);

-- Row Level Security
ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Service role bypass for server action / API execution
CREATE POLICY service_role_access_credentials ON public.access_credentials
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_login_attempts ON public.login_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin read/write policy for credentials
CREATE POLICY admin_manage_credentials ON public.access_credentials
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert initial seeds if empty
INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Master Administrator', 'admin', '$2b$10$btORtiHoQd93x5Hoe5RwJ.CKWODh./OR5k6mhqOHtrr1MXEkEbStO', 8, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'admin');

INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Dr. Alok Verma (OPD Clinic)', 'doctor', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'doctor');

INSERT INTO public.access_credentials (name, role, pin_hash, pin_length, is_active)
SELECT 'Health Officer Sharma', 'officer', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.access_credentials WHERE role = 'officer');



-- ------------------------------------------------------------------------------
-- SEED DATA: initial users, medicines, prescriptions & role PINs
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- KIET Smart Care - Comprehensive Database Seed Data
-- 1 Admin, 1 Doctor, 1 Officer, 10 Students, Formulary & Sample Clinical Visits
-- ==============================================================================

-- Clean slate for seed repeatability
TRUNCATE TABLE audit_logs, call_logs, alerts, recovery_checks, dose_events, dose_schedule, visit_medications, visits, medicines, student_meal_times, consent_records, devices, students, profiles CASCADE;

-- Fixed UUIDs for predictable relational integrity across environments
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
  v_doctor_id UUID := 'd0000000-0000-0000-0000-000000000002'::UUID;
  v_officer_id UUID := 'e0000000-0000-0000-0000-000000000003'::UUID;

  v_s1_user UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
  v_s2_user UUID := 'b0000000-0000-0000-0000-000000000002'::UUID;
  v_s3_user UUID := 'b0000000-0000-0000-0000-000000000003'::UUID;
  v_s4_user UUID := 'b0000000-0000-0000-0000-000000000004'::UUID;
  v_s5_user UUID := 'b0000000-0000-0000-0000-000000000005'::UUID;
  v_s6_user UUID := 'b0000000-0000-0000-0000-000000000006'::UUID;
  v_s7_user UUID := 'b0000000-0000-0000-0000-000000000007'::UUID;
  v_s8_user UUID := 'b0000000-0000-0000-0000-000000000008'::UUID;
  v_s9_user UUID := 'b0000000-0000-0000-0000-000000000009'::UUID;
  v_s10_user UUID := 'b0000000-0000-0000-0000-000000000010'::UUID;

  v_s1_id UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
  v_s2_id UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;
  v_s3_id UUID := 'c0000000-0000-0000-0000-000000000003'::UUID;
  v_s4_id UUID := 'c0000000-0000-0000-0000-000000000004'::UUID;
  v_s5_id UUID := 'c0000000-0000-0000-0000-000000000005'::UUID;
  v_s6_id UUID := 'c0000000-0000-0000-0000-000000000006'::UUID;
  v_s7_id UUID := 'c0000000-0000-0000-0000-000000000007'::UUID;
  v_s8_id UUID := 'c0000000-0000-0000-0000-000000000008'::UUID;
  v_s9_id UUID := 'c0000000-0000-0000-0000-000000000009'::UUID;
  v_s10_id UUID := 'c0000000-0000-0000-0000-000000000010'::UUID;

  v_med_pcm UUID := '10000000-0000-0000-0000-000000000001'::UUID;
  v_med_panto UUID := '10000000-0000-0000-0000-000000000002'::UUID;
  v_med_cetirizine UUID := '10000000-0000-0000-0000-000000000003'::UUID;
  v_med_amox UUID := '10000000-0000-0000-0000-000000000004'::UUID;
  v_med_ors UUID := '10000000-0000-0000-0000-000000000005'::UUID;

  v_visit_1 UUID := 'f0000000-0000-0000-0000-000000000001'::UUID;
  v_visit_2 UUID := 'f0000000-0000-0000-0000-000000000002'::UUID;
  v_visit_3 UUID := 'f0000000-0000-0000-0000-000000000003'::UUID;

  v_hash_pass TEXT;
BEGIN
  -- Hash standard seed password using pgcrypto
  v_hash_pass := crypt('KietSmartCare2026!', gen_salt('bf'));

  -- 1. AUTH USERS (Staff and Students)
  -- In Supabase, inserting into auth.users allows seamless local & hosted testing
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@kiet.edu', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Director Dr. A. P. Garg"}', now(), now(), 'authenticated', 'authenticated'),
    (v_doctor_id, '00000000-0000-0000-0000-000000000000', 'doctor.verma@kiet.edu', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Alok Verma, MD"}', now(), now(), 'authenticated', 'authenticated'),
    (v_officer_id, '00000000-0000-0000-0000-000000000000', 'officer.suresh@kiet.edu', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Officer Suresh Varma"}', now(), now(), 'authenticated', 'authenticated'),
    
    (v_s1_user, '00000000-0000-0000-0000-000000000000', '2200290120019@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2200290120019"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s2_user, '00000000-0000-0000-0000-000000000000', '2100290100112@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2100290100112"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s3_user, '00000000-0000-0000-0000-000000000000', '2300290130088@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2300290130088"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s4_user, '00000000-0000-0000-0000-000000000000', '2200290110054@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2200290110054"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s5_user, '00000000-0000-0000-0000-000000000000', '2400290100015@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2400290100015"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s6_user, '00000000-0000-0000-0000-000000000000', '2200290120101@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2200290120101"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s7_user, '00000000-0000-0000-0000-000000000000', '2300290140022@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2300290140022"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s8_user, '00000000-0000-0000-0000-000000000000', '2100290100045@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2100290100045"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s9_user, '00000000-0000-0000-0000-000000000000', '2400290130076@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2400290130076"}', now(), now(), 'authenticated', 'authenticated'),
    (v_s10_user, '00000000-0000-0000-0000-000000000000', '2200290150033@students.kiet.local', v_hash_pass, now(), '{"provider":"email","providers":["email"]}', '{"roll_number":"2200290150033"}', now(), now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- 2. STAFF & STUDENT PROFILES
  INSERT INTO profiles (id, role, full_name, phone, status)
  VALUES
    (v_admin_id, 'admin', 'Director Dr. A. P. Garg', '+91 98480 00001', 'active'),
    (v_doctor_id, 'doctor', 'Dr. Alok Verma, MD (OPD)', '+91 98480 00002', 'active'),
    (v_officer_id, 'officer', 'Officer Suresh Varma (Health Triage)', '+91 98480 00003', 'active'),

    (v_s1_user, 'student', 'Aarav Sharma', '+91 98765 43210', 'active'),
    (v_s2_user, 'student', 'Sneha Patel', '+91 98112 34567', 'active'),
    (v_s3_user, 'student', 'Rohan Verma', '+91 97654 32109', 'active'),
    (v_s4_user, 'student', 'Priya Nair', '+91 98234 56789', 'active'),
    (v_s5_user, 'student', 'Kabir Singh', '+91 99123 45678', 'active'),
    (v_s6_user, 'student', 'Ananya Reddy', '+91 98345 67890', 'active'),
    (v_s7_user, 'student', 'Manish Tyagi', '+91 98990 12345', 'active'),
    (v_s8_user, 'student', 'Rahul Sharma', '+91 98480 11223', 'active'),
    (v_s9_user, 'student', 'Pooja Gupta', '+91 98711 22334', 'active'),
    (v_s10_user, 'student', 'Vikram Rathore', '+91 98655 44332', 'active')
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  -- 3. STUDENTS ROSTER (10 STUDENTS)
  INSERT INTO students (id, profile_id, roll_number, name, branch, year, phone, allergies, emergency_contact, status)
  VALUES
    (v_s1_id, v_s1_user, '2200290120019', 'Aarav Sharma', 'Computer Science & Engineering', 3, '+91 98765 43210', ARRAY['Penicillin', 'Sulfa drugs'], '+91 98765 00001', 'active'),
    (v_s2_id, v_s2_user, '2100290100112', 'Sneha Patel', 'Information Technology', 4, '+91 98112 34567', ARRAY['Aspirin', 'Ibuprofen'], '+91 98112 00002', 'active'),
    (v_s3_id, v_s3_user, '2300290130088', 'Rohan Verma', 'Electronics & Communication', 2, '+91 97654 32109', '{}'::TEXT[], '+91 97654 00003', 'active'),
    (v_s4_id, v_s4_user, '2200290110054', 'Priya Nair', 'Mechanical Engineering', 3, '+91 98234 56789', ARRAY['Paracetamol (Mild)'], '+91 98234 00004', 'active'),
    (v_s5_id, v_s5_user, '2400290100015', 'Kabir Singh', 'Electrical Engineering', 1, '+91 99123 45678', '{}'::TEXT[], '+91 99123 00005', 'active'),
    (v_s6_id, v_s6_user, '2200290120101', 'Ananya Reddy', 'Computer Science & Engineering', 3, '+91 98345 67890', '{}'::TEXT[], '+91 98345 00006', 'active'),
    (v_s7_id, v_s7_user, '2300290140022', 'Manish Tyagi', 'Mechanical Engineering', 2, '+91 98990 12345', '{}'::TEXT[], '+91 98990 00007', 'active'),
    (v_s8_id, v_s8_user, '2100290100045', 'Rahul Sharma', 'Computer Science & Engineering', 4, '+91 98480 11223', ARRAY['Sulfa drugs'], '+91 98480 00008', 'active'),
    (v_s9_id, v_s9_user, '2400290130076', 'Pooja Gupta', 'Electronics & Communication', 1, '+91 98711 22334', '{}'::TEXT[], '+91 98711 00009', 'active'),
    (v_s10_id, v_s10_user, '2200290150033', 'Vikram Rathore', 'Civil Engineering', 3, '+91 98655 44332', '{}'::TEXT[], '+91 98655 00010', 'active')
  ON CONFLICT (id) DO UPDATE SET
    roll_number = EXCLUDED.roll_number,
    name = EXCLUDED.name;

  -- 4. STUDENT MEAL SCHEDULES
  INSERT INTO student_meal_times (student_id, breakfast, lunch, dinner)
  VALUES
    (v_s1_id, '08:15:00', '13:30:00', '20:30:00'),
    (v_s2_id, '08:00:00', '13:00:00', '20:00:00'),
    (v_s3_id, '08:30:00', '13:15:00', '21:00:00'),
    (v_s4_id, '07:45:00', '12:45:00', '19:45:00'),
    (v_s5_id, '08:00:00', '13:00:00', '20:00:00'),
    (v_s6_id, '08:15:00', '13:00:00', '20:30:00'),
    (v_s7_id, '08:30:00', '13:30:00', '21:00:00'),
    (v_s8_id, '08:00:00', '13:00:00', '20:00:00'),
    (v_s9_id, '08:15:00', '12:45:00', '20:15:00'),
    (v_s10_id, '08:00:00', '13:15:00', '20:00:00')
  ON CONFLICT (student_id) DO NOTHING;

  -- 5. MEDICINES CATALOG
  INSERT INTO medicines (id, name, default_form, active)
  VALUES
    (v_med_pcm, 'Paracetamol 650mg', 'tablet', true),
    (v_med_panto, 'Pantoprazole 40mg', 'tablet', true),
    (v_med_cetirizine, 'Cetirizine 10mg', 'tablet', true),
    (v_med_amox, 'Amoxicillin 500mg', 'capsule', true),
    (v_med_ors, 'ORS Electrolyte Sachet', 'sachet', true),
    ('10000000-0000-0000-0000-000000000006'::UUID, 'Azithromycin 500mg', 'tablet', true),
    ('10000000-0000-0000-0000-000000000007'::UUID, 'Dextromethorphan Syrup', 'syrup', true),
    ('10000000-0000-0000-0000-000000000008'::UUID, 'Ibuprofen 400mg', 'tablet', true),
    ('10000000-0000-0000-0000-000000000009'::UUID, 'Domperidone 10mg', 'tablet', true),
    ('10000000-0000-0000-0000-000000000010'::UUID, 'Multivitamin + Zinc', 'capsule', true)
  ON CONFLICT (id) DO NOTHING;

  -- 6. SAMPLE CLINICAL VISITS
  -- Visit 1: Dr. Verma -> Aarav Sharma
  INSERT INTO visits (id, student_id, doctor_id, problem_category, notes, visit_date, status)
  VALUES
    (v_visit_1, v_s1_id, v_doctor_id, 'Acute Viral Illness', 'Student presented with high grade fever 101F, body ache, and mild throat irritation for 2 days. Chest clear.', now() - INTERVAL '2 days', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Visit 2: Dr. Verma -> Sneha Patel
  INSERT INTO visits (id, student_id, doctor_id, problem_category, notes, visit_date, status)
  VALUES
    (v_visit_2, v_s2_id, v_doctor_id, 'Bronchial Congestion', 'Persistent dry cough aggravated at night. Wheezing absent. Hydration advised.', now() - INTERVAL '3 days', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Visit 3: Dr. Verma -> Manish Tyagi
  INSERT INTO visits (id, student_id, doctor_id, problem_category, notes, visit_date, status)
  VALUES
    (v_visit_3, v_s7_id, v_doctor_id, 'Acute Gastritis', 'Epigastric discomfort and acid reflux after irregular hostel meals. Advised light diet.', now() - INTERVAL '1 day', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 7. STRUCTURED PRESCRIPTIONS
  -- Note: Inserting into visit_medications will automatically trigger dose_schedule creation!
  INSERT INTO visit_medications (visit_id, medicine_id, dose, times_per_day, meal_relation, days, quantity_handed_over)
  VALUES
    (v_visit_1, v_med_pcm, '1 tablet', 2, 'after', 3, 6),
    (v_visit_1, v_med_panto, '1 tablet', 1, 'before', 3, 3),
    (v_visit_2, v_med_cetirizine, '1 tablet', 1, 'after', 3, 3),
    (v_visit_3, v_med_panto, '1 tablet', 1, 'before', 2, 2);

  -- 8. INITIAL CLINICAL ALERTS FOR TESTING
  INSERT INTO alerts (id, visit_id, student_id, doctor_id, type, severity, status, created_at)
  VALUES
    ('a0000000-0000-0000-0000-000000000101'::UUID, v_visit_1, v_s1_id, v_doctor_id, 'worse', 'red', 'open', now() - INTERVAL '30 minutes'),
    ('a0000000-0000-0000-0000-000000000102'::UUID, v_visit_2, v_s2_id, v_doctor_id, 'side_effect', 'red', 'in_progress', now() - INTERVAL '2 hours')
  ON CONFLICT (id) DO NOTHING;

  -- 9. LOGS FOR OFFICER TESTING
  INSERT INTO call_logs (alert_id, officer_id, outcome, notes, called_at)
  VALUES
    ('a0000000-0000-0000-0000-000000000102'::UUID, v_officer_id, 'reached', 'Student reported rash on arm. Advised discontinuing Cetirizine and immediate OPD visit.', now() - INTERVAL '1 hour');

  -- 10. CONSENT RECORDS
  INSERT INTO consent_records (student_id, purpose, status)
  VALUES
    (v_s1_id, 'Campus clinic medical adherence and recovery monitoring', 'accepted'),
    (v_s2_id, 'Campus clinic medical adherence and recovery monitoring', 'accepted'),
    (v_s3_id, 'Campus clinic medical adherence and recovery monitoring', 'accepted');

  -- 11. ROLE PIN ACCESS CREDENTIALS
  INSERT INTO access_credentials (name, role, pin_hash, pin_length, is_active)
  VALUES
    ('Master Administrator', 'admin', '$2b$10$btORtiHoQd93x5Hoe5RwJ.CKWODh./OR5k6mhqOHtrr1MXEkEbStO', 8, true),
    ('Dr. Alok Verma (OPD Clinic)', 'doctor', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true),
    ('Health Officer Sharma', 'officer', '$2b$10$uQdPG1wR984/n9CRcPoOEuxKPSbLgByXsRdfdmqKZb0McpRELz/jC', 5, true)
  ON CONFLICT DO NOTHING;

END $$;




-- ==============================================================================
-- ADDENDUM: 20261101020000_doctor_profiles_and_attendance.sql
-- ==============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Campus Clinic OPD Doctor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

DO $$ BEGIN
  ALTER TYPE profile_status ADD VALUE IF NOT EXISTS 'deleted';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Campus Clinic OPD Doctor';
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

UPDATE public.profiles 
SET qualification = 'MBBS, MD', 
    designation = 'Campus Clinic OPD Doctor',
    email = 'alok.verma@kiet.edu'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

UPDATE public.profiles 
SET qualification = 'Ph.D, M.Tech', 
    designation = 'Institutional Director & Administrator',
    email = 'admin@kiet.edu'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.profiles 
SET qualification = 'B.Sc Nursing, MPH', 
    designation = 'Health Surveillance & Triage Officer',
    email = 'officer.sharma@kiet.edu'
WHERE id = 'e0000000-0000-0000-0000-000000000003';

CREATE OR REPLACE FUNCTION public.get_admin_attendance_records(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  visit_id UUID,
  visit_date DATE,
  visit_time TIME,
  roll_number TEXT,
  student_name TEXT,
  branch TEXT,
  year INT,
  doctor_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.id AS visit_id,
    v.visit_date::DATE AS visit_date,
    v.visit_date::TIME AS visit_time,
    s.roll_number,
    s.name AS student_name,
    s.branch,
    s.year,
    COALESCE(p.full_name, 'Dr. OPD Clinic') AS doctor_name
  FROM visits v
  JOIN students s ON s.id = v.student_id
  LEFT JOIN profiles p ON p.id = v.doctor_id
  WHERE v.visit_date::DATE BETWEEN p_start_date AND p_end_date
  ORDER BY v.visit_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_attendance_records(DATE, DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.protect_last_active_admin()
RETURNS TRIGGER AS $$
DECLARE
  active_admin_count INT;
BEGIN
  IF (OLD.role = 'admin' AND OLD.status = 'active') AND
     (NEW.status != 'active' OR NEW.role != 'admin') THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE role = 'admin' AND status = 'active' AND id != OLD.id;

    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Action blocked: The last active administrator account cannot be disabled, deleted, or demoted.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_last_active_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_active_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_last_active_admin();

CREATE OR REPLACE FUNCTION public.prevent_delete_last_active_admin()
RETURNS TRIGGER AS $$
DECLARE
  active_admin_count INT;
BEGIN
  IF (OLD.role = 'admin' AND OLD.status = 'active') THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE role = 'admin' AND status = 'active' AND id != OLD.id;

    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Action blocked: Cannot delete the last active administrator.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_last_active_admin ON public.profiles;
CREATE TRIGGER trg_prevent_delete_last_active_admin
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_last_active_admin();

CREATE OR REPLACE FUNCTION public.protect_last_active_admin_credential()
RETURNS TRIGGER AS $$
DECLARE
  active_admin_count INT;
BEGIN
  IF (OLD.role = 'admin' AND OLD.is_active = true) AND
     (NEW.is_active = false OR NEW.role != 'admin') THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.access_credentials
    WHERE role = 'admin' AND is_active = true AND id != OLD.id;

    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Action blocked: Cannot disable or demote the last active administrator credential.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_last_active_admin_cred ON public.access_credentials;
CREATE TRIGGER trg_protect_last_active_admin_cred
BEFORE UPDATE ON public.access_credentials
FOR EACH ROW
EXECUTE FUNCTION public.protect_last_active_admin_credential();

-- ------------------------------------------------------------------------------
-- MIGRATION: 20261101040000_doctor_redesign_tablets.sql
-- ------------------------------------------------------------------------------

-- 1. Create problem_categories table
CREATE TABLE IF NOT EXISTS public.problem_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed institutional problem categories
INSERT INTO public.problem_categories (name, sort_order)
VALUES
  ('Headache', 1),
  ('Body pain', 2),
  ('Fever', 3),
  ('Cold and cough', 4),
  ('Stomach pain', 5),
  ('Vomiting', 6),
  ('Sore throat', 7),
  ('Injury', 8),
  ('Other', 9)
ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- 2. Alter students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS residence_type TEXT CHECK (residence_type IN ('hostler', 'day_scholar'));
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- 3. Alter visits table
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS problems TEXT[];
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS other_problem TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS consultation_seconds INT DEFAULT 0;

-- 4. Alter visit_medications table
ALTER TABLE public.visit_medications ALTER COLUMN medicine_id DROP NOT NULL;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS label TEXT;

-- 5. Seed sample residence data for existing students
UPDATE public.students SET residence_type = 'hostler', room_number = 'B-214' WHERE roll_number = '2200290120019';
UPDATE public.students SET residence_type = 'day_scholar', room_number = NULL WHERE roll_number = '2200290120020';
UPDATE public.students SET residence_type = 'hostler', room_number = 'C-108' WHERE roll_number = '2300290100045';

