
-- Enum: área de atuação
CREATE TYPE public.project_area AS ENUM (
  'fiscalizacao_sanitaria',
  'engenharia',
  'arquitetura',
  'seguranca_trabalho',
  'auditoria',
  'pericia_veicular',
  'seguros',
  'agronegocio',
  'personalizado'
);

-- Enum: status do projeto
CREATE TYPE public.project_status AS ENUM (
  'planejamento',
  'em_andamento',
  'em_revisao',
  'concluido',
  'arquivado'
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  client text,
  area public.project_area NOT NULL DEFAULT 'personalizado',
  custom_area text,
  project_date date NOT NULL DEFAULT CURRENT_DATE,
  responsible_name text,
  responsible_registration text,
  status public.project_status NOT NULL DEFAULT 'planejamento',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own projects"
ON public.projects FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own projects"
ON public.projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own projects"
ON public.projects FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_projects_user ON public.projects(user_id, created_at DESC);
CREATE INDEX idx_projects_area ON public.projects(area);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
