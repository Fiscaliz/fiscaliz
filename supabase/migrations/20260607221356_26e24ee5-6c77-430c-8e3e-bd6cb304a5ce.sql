
CREATE TYPE public.ai_training_doc_type AS ENUM ('relatorio','laudo','procedimento','norma','checklist','modelo_interno','outro');
CREATE TYPE public.ai_training_status AS ENUM ('pending','processing','completed','failed');

CREATE TABLE public.ai_company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  area_of_practice text,
  profession text,
  report_types text[] DEFAULT '{}',
  vocabulary jsonb DEFAULT '[]'::jsonb,
  document_structure jsonb DEFAULT '{}'::jsonb,
  evidence_types jsonb DEFAULT '[]'::jsonb,
  report_format jsonb DEFAULT '{}'::jsonb,
  summary text,
  documents_analyzed int NOT NULL DEFAULT 0,
  last_trained_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_company_profile TO authenticated;
GRANT ALL ON public.ai_company_profile TO service_role;
ALTER TABLE public.ai_company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.ai_company_profile FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ai_company_profile_updated BEFORE UPDATE ON public.ai_company_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  doc_type public.ai_training_doc_type NOT NULL DEFAULT 'outro',
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  status public.ai_training_status NOT NULL DEFAULT 'pending',
  extracted_text text,
  analysis jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_training_documents TO authenticated;
GRANT ALL ON public.ai_training_documents TO service_role;
ALTER TABLE public.ai_training_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own training docs" ON public.ai_training_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_training_docs_user ON public.ai_training_documents(user_id, created_at DESC);
CREATE TRIGGER trg_ai_training_docs_updated BEFORE UPDATE ON public.ai_training_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
