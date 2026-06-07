
-- Remove duplicate storage policies on fiscal-photos
DROP POLICY IF EXISTS "Users can upload their own fiscal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own fiscal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own fiscal photos" ON storage.objects;

-- Add admin SELECT policy on fiscal_documents for compliance oversight
CREATE POLICY "Admins can view all fiscal documents"
  ON public.fiscal_documents
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
