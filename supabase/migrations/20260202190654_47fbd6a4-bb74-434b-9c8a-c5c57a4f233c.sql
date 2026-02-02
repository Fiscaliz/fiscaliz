-- Tabela para armazenar a sequência de numeração por tipo de documento
CREATE TABLE public.document_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type text NOT NULL UNIQUE,
  prefix text NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir os tipos de documento com seus prefixos
-- Relatório Técnico e Relatório de Atividade não são numerados
INSERT INTO public.document_sequences (document_type, prefix, last_number) VALUES
  ('termo_intimacao', 'TI', 0),
  ('visita_fiscal', 'VF', 0),
  ('auto_infracao', 'AI', 0),
  ('advertencia', 'ADV', 0),
  ('inutilizacao', 'INUT', 0),
  ('apreensao', 'APR', 0),
  ('interdicao', 'INT', 0),
  ('notificacao', 'NOT', 0),
  ('replica', 'REP', 0),
  ('certidao', 'CE', 0),
  ('coleta_amostra', 'CA', 0);

-- Função para obter o próximo número de documento (atômica)
CREATE OR REPLACE FUNCTION public.get_next_document_number(p_document_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_next_number integer;
  v_formatted_number text;
BEGIN
  -- Tipos que não são numerados
  IF p_document_type IN ('relatorio_tecnico', 'relatorio_atividade') THEN
    RETURN NULL;
  END IF;

  -- Atualizar e obter o próximo número atomicamente
  UPDATE document_sequences
  SET last_number = last_number + 1,
      updated_at = now()
  WHERE document_type = p_document_type
  RETURNING prefix, last_number INTO v_prefix, v_next_number;

  -- Se não encontrou o tipo, retorna null
  IF v_prefix IS NULL THEN
    RETURN NULL;
  END IF;

  -- Formatar como PREFIX-000000
  v_formatted_number := v_prefix || '-' || LPAD(v_next_number::text, 6, '0');
  
  RETURN v_formatted_number;
END;
$$;

-- RLS: Apenas leitura para usuários autenticados
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sequences"
ON public.document_sequences
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_document_sequences_updated_at
  BEFORE UPDATE ON public.document_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();