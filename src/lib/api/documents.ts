import { supabase } from '../supabase/client';

const BUCKET = 'documents';
const GDPR_FILE_PATH = 'deklaratcia suglasie';

// ─── Download ────────────────────────────────────────────────────────────────

/**
 * Returns the public URL of the GDPR declaration file.
 * Works for any authenticated user.
 */
export function getGdprDeclarationUrl(): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(GDPR_FILE_PATH);
  return data.publicUrl;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadGdprResult {
  success: boolean;
  error?: string;
}

/**
 * Uploads (or replaces) the GDPR declaration file.
 * Only admins are permitted by RLS policies.
 * Accepts .docx or .pdf files.
 */
export async function uploadGdprDeclaration(file: File): Promise<UploadGdprResult> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(GDPR_FILE_PATH, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
