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
