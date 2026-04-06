
-- Fix signature storage policies to enforce user-ID ownership
-- Signatures are stored as: signatures/{user_id}-{timestamp}.{ext}

-- Drop existing overly permissive signature policies
DROP POLICY IF EXISTS "Users can upload own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own signatures" ON storage.objects;

-- Recreate with user-ID enforcement in filename
CREATE POLICY "Users can upload own signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND starts_with(storage.filename(name), (auth.uid())::text)
);

CREATE POLICY "Users can update own signatures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND starts_with(storage.filename(name), (auth.uid())::text)
);

CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND starts_with(storage.filename(name), (auth.uid())::text)
);

-- Update SELECT policy to also cover signatures with user-ID check
-- First check existing SELECT policy name
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;

CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fiscal-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (
      (storage.foldername(name))[1] = 'signatures'
      AND starts_with(storage.filename(name), (auth.uid())::text)
    )
  )
);
