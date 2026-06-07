
CREATE POLICY "evidences read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidences' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "evidences insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidences' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "evidences update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'evidences' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "evidences delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidences' AND auth.uid()::text = (storage.foldername(name))[1]);
