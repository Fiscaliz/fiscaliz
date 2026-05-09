-- Profiles: scope policies to authenticated only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fiscal actions: admin oversight
CREATE POLICY "Admins can view all fiscal actions"
  ON public.fiscal_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage: support folder-based signature path; keep legacy filename prefix for back-compat
DROP POLICY IF EXISTS "Users can upload own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;

CREATE POLICY "Users can upload own signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR starts_with(storage.filename(name), (auth.uid())::text)
  )
);

CREATE POLICY "Users can update own signatures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR starts_with(storage.filename(name), (auth.uid())::text)
  )
);

CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fiscal-photos'
  AND (storage.foldername(name))[1] = 'signatures'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR starts_with(storage.filename(name), (auth.uid())::text)
  )
);

CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fiscal-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (
      (storage.foldername(name))[1] = 'signatures'
      AND (
        (storage.foldername(name))[2] = (auth.uid())::text
        OR starts_with(storage.filename(name), (auth.uid())::text)
      )
    )
  )
);

-- Drop unused single-argument has_role overload
DROP FUNCTION IF EXISTS public.has_role(app_role);
