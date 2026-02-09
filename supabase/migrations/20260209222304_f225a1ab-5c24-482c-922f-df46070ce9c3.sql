
-- Add new registration fields to profiles (all nullable for backward compatibility)
ALTER TABLE public.profiles
ADD COLUMN user_type text, -- 'auditor_fiscal' or 'consultor_privado'
ADD COLUMN institutional_link text, -- 'municipio', 'estado', 'empresa_privada'
ADD COLUMN institution_name text,
ADD COLUMN institution_logo_url text,
ADD COLUMN areas_of_practice text[];
