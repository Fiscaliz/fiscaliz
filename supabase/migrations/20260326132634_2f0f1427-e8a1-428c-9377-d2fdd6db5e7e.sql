
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS organ_name text,
  ADD COLUMN IF NOT EXISTS pdf_header_text text,
  ADD COLUMN IF NOT EXISTS custom_legislations jsonb DEFAULT '[]'::jsonb;
