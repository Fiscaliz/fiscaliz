
CREATE POLICY "ai-training own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-training' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-training own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-training' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-training own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ai-training' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-training own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-training' AND auth.uid()::text = (storage.foldername(name))[1]);
