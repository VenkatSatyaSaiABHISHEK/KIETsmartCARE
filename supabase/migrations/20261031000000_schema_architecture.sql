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
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_student_meal_times_updated_at BEFORE UPDATE ON student_meal_times FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_visit_medications_updated_at BEFORE UPDATE ON visit_medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dose_schedule_updated_at BEFORE UPDATE ON dose_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dose_events_updated_at BEFORE UPDATE ON dose_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_recovery_checks_updated_at BEFORE UPDATE ON recovery_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_call_logs_updated_at BEFORE UPDATE ON call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
