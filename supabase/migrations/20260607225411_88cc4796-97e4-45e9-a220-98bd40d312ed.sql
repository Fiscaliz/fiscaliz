ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS activity_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS report_tools text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS initial_template text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;