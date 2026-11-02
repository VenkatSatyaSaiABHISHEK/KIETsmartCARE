import { createClient } from './client';

/**
 * Generate a short-lived signed URL for a private file in Supabase Storage.
 * Invariant: Storage buckets are private; files are never publicly exposed.
 * @param bucket 'student-photos' | 'medical-documents'
 * @param path Storage file path (e.g. 'std-001/avatar.jpg')
 * @param expiresInSeconds Lifetime of signed URL in seconds (default 300s = 5 minutes)
 */
export async function getSignedFileUrl(
  bucket: 'student-photos' | 'medical-documents',
  path: string,
  expiresInSeconds: number = 300
): Promise<string | null> {
  if (!path) return null;
  // If already a full http/https url (e.g. external avatar fallback), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    console.error(`Failed to generate signed URL for bucket ${bucket}, path ${path}:`, error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Upload a private document or photo to Supabase Storage
 */
export async function uploadPrivateFile(
  bucket: 'student-photos' | 'medical-documents',
  path: string,
  file: File | Blob
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error || !data) {
    return { success: false, error: error?.message || 'Upload failed' };
  }

  return { success: true, path: data.path };
}
