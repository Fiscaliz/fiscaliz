-- Adicionar colunas email e signature_url na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS signature_url text;