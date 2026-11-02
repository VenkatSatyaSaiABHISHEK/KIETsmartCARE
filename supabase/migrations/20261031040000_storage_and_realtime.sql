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
