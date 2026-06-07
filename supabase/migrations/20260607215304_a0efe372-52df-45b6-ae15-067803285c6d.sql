
CREATE TABLE public.evidence_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0F4C5C',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_categories TO authenticated;
GRANT ALL ON public.evidence_categories TO service_role;
ALTER TABLE public.evidence_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages categories"
ON public.evidence_categories FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.evidence_categories(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  width integer,
  height integer,
  position integer NOT NULL DEFAULT 0,
  captured_at timestamptz,
  caption text,
  observation text,
  finding text,
  risk_level text,
  annotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis jsonb,
  ai_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidences TO authenticated;
GRANT ALL ON public.evidences TO service_role;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages evidences"
ON public.evidences FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_evidences_project ON public.evidences(project_id, position);
CREATE INDEX idx_evidences_user ON public.evidences(user_id, created_at DESC);
CREATE INDEX idx_evidences_category ON public.evidences(category_id);
CREATE INDEX idx_evidence_categories_project ON public.evidence_categories(project_id, position);

CREATE TRIGGER trg_evidences_updated_at
BEFORE UPDATE ON public.evidences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
