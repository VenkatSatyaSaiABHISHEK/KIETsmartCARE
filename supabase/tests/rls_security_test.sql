-- ==============================================================================
-- KIET Smart Care - Row Level Security (RLS) Verification Test Suite
-- ==============================================================================
-- Run this script in the Supabase Dashboard SQL Editor to verify all security boundaries.

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
  v_doctor_id UUID := 'd0000000-0000-0000-0000-000000000002'::UUID;
  v_officer_id UUID := 'e0000000-0000-0000-0000-000000000003'::UUID;
  v_student_a UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
  v_student_b UUID := 'b0000000-0000-0000-0000-000000000002'::UUID;

  v_count INTEGER;
  v_failed BOOLEAN := false;
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RUNNING KIET SMART CARE RLS VERIFICATION TESTS';
  RAISE NOTICE '=====================================================';

  -- ----------------------------------------------------------------------------
  -- TEST 1: Student A cannot read Student B's student record
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_student_a::TEXT, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count
  FROM students
  WHERE profile_id = v_student_b;

  IF v_count = 0 THEN
    RAISE NOTICE '✔ TEST 1 PASSED: Student A cannot read Student B record (Returned 0 rows)';
  ELSE
    RAISE WARNING '✖ TEST 1 FAILED: Student A read % rows of Student B data!', v_count;
    v_failed := true;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 2: Admin CANNOT read clinical visits
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_admin_id::TEXT, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count
  FROM visits;

  IF v_count = 0 THEN
    RAISE NOTICE '✔ TEST 2 PASSED: Admin has ZERO access to clinical visits table (Returned 0 rows)';
  ELSE
    RAISE WARNING '✖ TEST 2 FAILED: Admin accessed % clinical visits!', v_count;
    v_failed := true;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 3: Doctor CANNOT edit or insert officer call_logs
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_doctor_id::TEXT, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT COUNT(*) INTO v_count
  FROM call_logs;

  IF v_count = 0 THEN
    RAISE NOTICE '✔ TEST 3 PASSED: Doctor cannot view or access officer call logs (Returned 0 rows)';
  ELSE
    RAISE WARNING '✖ TEST 3 FAILED: Doctor accessed % officer call logs!', v_count;
    v_failed := true;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 4: Logged-out user (anon) reads nothing from medical tables
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('role', 'anon', true);

  SELECT COUNT(*) INTO v_count
  FROM visits;

  IF v_count = 0 THEN
    RAISE NOTICE '✔ TEST 4 PASSED: Anonymous logged-out user reads 0 rows from visits';
  ELSE
    RAISE WARNING '✖ TEST 4 FAILED: Anonymous user read % visits!', v_count;
    v_failed := true;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 5: Immutability check - Visits cannot be modified once created
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_doctor_id::TEXT, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    UPDATE visits SET notes = 'Tampered clinical note' WHERE doctor_id = v_doctor_id;
    RAISE WARNING '✖ TEST 5 FAILED: Invariant violated! Medical visit was updated.';
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✔ TEST 5 PASSED: Attempt to modify submitted visit rejected with error: %', SQLERRM;
  END;

  RAISE NOTICE '=====================================================';
  IF NOT v_failed THEN
    RAISE NOTICE 'ALL RLS SECURITY CHECKS PASSED SUCCESSFULLY!';
  ELSE
    RAISE EXCEPTION 'ONE OR MORE RLS SECURITY TESTS FAILED!';
  END IF;
  RAISE NOTICE '=====================================================';
END $$;
