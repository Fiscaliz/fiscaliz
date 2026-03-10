-- Fix has_role() to prevent role enumeration for arbitrary users
-- Overload with single parameter (preferred, uses auth.uid() internally)
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;

-- Keep backward-compatible 2-param overload but restrict to own user only
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() THEN
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    ELSE false
  END
$$;