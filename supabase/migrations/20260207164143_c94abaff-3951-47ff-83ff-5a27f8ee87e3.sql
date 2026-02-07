
-- Fix 1: Restrict establishments UPDATE policy to creator or admin
DROP POLICY IF EXISTS "Authenticated users can update establishments" ON public.establishments;
CREATE POLICY "Users can update own establishments"
ON public.establishments FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Make fiscal-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'fiscal-photos';

-- Update SELECT policy to require authentication
DROP POLICY IF EXISTS "Anyone can view fiscal photos" ON storage.objects;
CREATE POLICY "Authenticated users can view fiscal photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fiscal-photos');
