
-- Fix 1: Make fiscal-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'fiscal-photos';

-- Remove overly permissive public read policy
DROP POLICY IF EXISTS "Public Access to Photos" ON storage.objects;

-- Add owner-scoped read policy
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fiscal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Harden get_next_document_number with auth + role checks
CREATE OR REPLACE FUNCTION public.get_next_document_number(p_document_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_next_number integer;
  v_formatted_number text;
  v_user_id uuid;
BEGIN
  -- Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Role authorization check
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('fiscal', 'admin', 'gestor')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Non-numbered types
  IF p_document_type IN ('relatorio_tecnico', 'relatorio_atividade') THEN
    RETURN NULL;
  END IF;

  -- Atomically update and get next number
  UPDATE document_sequences
  SET last_number = last_number + 1,
      updated_at = now()
  WHERE document_type = p_document_type
  RETURNING prefix, last_number INTO v_prefix, v_next_number;

  IF v_prefix IS NULL THEN
    RETURN NULL;
  END IF;

  v_formatted_number := v_prefix || '-' || LPAD(v_next_number::text, 6, '0');

  RETURN v_formatted_number;
END;
$$;
