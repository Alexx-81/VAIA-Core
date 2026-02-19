-- Create a public storage bucket for documents (e.g. GDPR declaration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10 MB limit
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/msword'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: All authenticated users can read files in the documents bucket
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
);

-- RLS: Only admins can upload/update files in the documents bucket
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND public.is_admin()
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND public.is_admin()
);

-- RLS: Only admins can delete files in the documents bucket
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND public.is_admin()
);
