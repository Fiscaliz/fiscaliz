
-- Drop orphaned public-access policy
DROP POLICY IF EXISTS "Fiscal photos are publicly accessible" ON storage.objects;

-- Drop overly-broad authenticated-access policy
DROP POLICY IF EXISTS "Authenticated users can view fiscal photos" ON storage.objects;
