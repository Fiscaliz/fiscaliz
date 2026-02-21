-- Fix overly permissive UPDATE policy on establishments table
-- Currently ANY authenticated user can update ANY establishment

DROP POLICY IF EXISTS "Users can update own establishments" ON public.establishments;

-- Replace with creator-only + admin policies
CREATE POLICY "Creators can update own establishments"
ON public.establishments
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update any establishment"
ON public.establishments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));