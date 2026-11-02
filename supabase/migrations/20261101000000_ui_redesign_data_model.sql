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
