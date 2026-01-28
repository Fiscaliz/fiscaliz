-- Create policy for users to upload their own signatures
CREATE POLICY "Users can upload own signatures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'fiscal-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'signatures'
);

-- Create policy for users to update their own signatures
CREATE POLICY "Users can update own signatures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'fiscal-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'signatures'
);

-- Create policy for users to delete their own signatures
CREATE POLICY "Users can delete own signatures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'fiscal-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'signatures'
);