-- Create storage bucket for fiscal document photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fiscal-photos', 'fiscal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fiscal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for public read access
CREATE POLICY "Anyone can view fiscal photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fiscal-photos');

-- Create policy for users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'fiscal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'fiscal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);