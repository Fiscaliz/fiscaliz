-- Adicionar novos campos para licenças e afastamentos no monthly_reports
ALTER TABLE public.monthly_reports 
ADD COLUMN IF NOT EXISTS license_type text,
ADD COLUMN IF NOT EXISTS license_start_date date,
ADD COLUMN IF NOT EXISTS license_end_date date,
ADD COLUMN IF NOT EXISTS license_attachment_url text,
ADD COLUMN IF NOT EXISTS days_to_work integer,
ADD COLUMN IF NOT EXISTS pfe_days integer DEFAULT 0;