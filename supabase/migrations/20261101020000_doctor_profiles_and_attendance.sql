-- ==============================================================================
-- Migration: 20261101020000_doctor_profiles_and_attendance.sql
-- Qualification, designation, strict attendance export, and last-admin protection
-- ==============================================================================

-- 1. ADD QUALIFICATION AND DESIGNATION TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Campus Clinic OPD Doctor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. SUPPORT 'deleted' STATUS IN profile_status ENUM
DO $$ BEGIN
  ALTER TYPE profile_status ADD VALUE IF NOT EXISTS 'deleted';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. EXTEND access_credentials FOR MULTI-ADMIN & PROFILE LINKAGE
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Campus Clinic OPD Doctor';
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.access_credentials ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Update existing default doctor profile
UPDATE public.profiles 
SET qualification = 'MBBS, MD', 
    designation = 'Campus Clinic OPD Doctor',
    email = 'alok.verma@kiet.edu'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

-- Update existing default admin profile
UPDATE public.profiles 
SET qualification = 'Ph.D, M.Tech', 
    designation = 'Institutional Director & Administrator',
    email = 'admin@kiet.edu'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update existing officer profile
UPDATE public.profiles 
SET qualification = 'B.Sc Nursing, MPH', 
    designation = 'Health Surveillance & Triage Officer',
    email = 'officer.sharma@kiet.edu'
WHERE id = 'e0000000-0000-0000-0000-000000000003';

-- 4. RESTRICTED SECURITY DEFINER FUNCTION FOR ADMIN ATTENDANCE EXPORT ONLY
-- Contains strictly non-clinical data. Zero problems, medicines, notes, or recovery data.
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

-- Grant access to authenticated users (admin verification handled in application & RLS)
GRANT EXECUTE ON FUNCTION public.get_admin_attendance_records(DATE, DATE) TO authenticated, service_role;

-- 5. TRIGGER: PROTECT LAST ACTIVE ADMINISTRATOR (Cannot disable, delete, or demote)
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

-- Prevent deletion of last admin
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

-- 6. PROTECT LAST ACTIVE ADMIN IN access_credentials TABLE
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

