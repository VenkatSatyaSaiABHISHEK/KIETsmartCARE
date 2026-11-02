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
