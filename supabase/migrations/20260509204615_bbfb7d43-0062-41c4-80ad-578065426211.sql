-- 1) Remove public SELECT policy on fiscal_documents
DROP POLICY IF EXISTS "Public can view sent documents via QR" ON public.fiscal_documents;

-- 2) Admin oversight on monthly_reports
CREATE POLICY "Admins can view all reports"
  ON public.monthly_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any report"
  ON public.monthly_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
  ON public.monthly_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Defense-in-depth restrictive policy on user_roles INSERT
CREATE POLICY "Only admins may insert roles (restrictive)"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));