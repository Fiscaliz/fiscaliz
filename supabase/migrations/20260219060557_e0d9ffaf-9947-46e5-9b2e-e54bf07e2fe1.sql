-- Make the fiscal-photos bucket public to support public URLs stored in the database
UPDATE storage.buckets
SET public = true
WHERE id = 'fiscal-photos';

-- Ensure public access policy exists
CREATE POLICY "Public Access to Photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'fiscal-photos' );