-- ==============================================================================
-- KIET Smart Care - Campus Healthcare Database Architecture
-- Target: Supabase (PostgreSQL with Row Level Security & pg_cron)
-- ==============================================================================

-- Core roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'officer', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Meal timing enum
DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner');
  CREATE TYPE meal_relation AS ENUM ('before', 'after');
  CREATE TYPE dose_status AS ENUM ('scheduled', 'taken', 'taken_late', 'not_taken', 'unconfirmed');
  CREATE TYPE recovery_status AS ENUM ('better', 'same', 'worse', 'side_effect', 'no_response');
  CREATE TYPE alert_level AS ENUM ('red', 'yellow', 'info');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Notes:
-- Full table schemas, triggers, pg_cron jobs, and granular Row Level Security (RLS)
-- policies will be provisioned in Stage 1 (Supabase schema and auth).
