-- =====================================================
-- FISCALIZ DATABASE SCHEMA
-- Sistema de Fiscalização Sanitária - Vigilância Sanitária de Goiânia
-- =====================================================

-- Enum types
CREATE TYPE public.document_status AS ENUM ('draft', 'sent', 'archived');
CREATE TYPE public.document_type AS ENUM (
  'termo_intimacao',
  'visita_fiscal', 
  'auto_infracao',
  'advertencia',
  'inutilizacao',
  'apreensao',
  'interdicao',
  'relatorio_tecnico',
  'notificacao',
  'replica',
  'certidao',
  'coleta_amostra'
);
CREATE TYPE public.fiscal_action_reason AS ENUM (
  'denuncia',
  'rotina',
  'relatorio_tecnico',
  'investigativa',
  'demanda_chefia',
  'surto',
  'operacao_conjunta',
  'coleta',
  'demanda_especifica',
  'outros'
);
CREATE TYPE public.establishment_risk_level AS ENUM ('I', 'II', 'III');
CREATE TYPE public.priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE public.app_role AS ENUM ('admin', 'fiscal', 'gestor');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  registration_number TEXT, -- Matrícula do servidor
  division TEXT, -- Divisão/Setor
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER ROLES TABLE (Security - separate from profiles)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'fiscal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- ESTABLISHMENTS TABLE
-- =====================================================
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco TEXT NOT NULL,
  bairro TEXT,
  cep TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  responsavel_nome TEXT,
  responsavel_cpf TEXT,
  responsavel_telefone TEXT,
  cnae_principal TEXT,
  risk_level establishment_risk_level DEFAULT 'II',
  alvara_numero TEXT,
  alvara_validade DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view establishments" ON public.establishments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert establishments" ON public.establishments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update establishments" ON public.establishments
  FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_establishments_cnpj ON public.establishments(cnpj);
CREATE INDEX idx_establishments_bairro ON public.establishments(bairro);

-- =====================================================
-- FISCAL ACTIONS (Ações Fiscais)
-- =====================================================
CREATE TABLE public.fiscal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  establishment_id UUID REFERENCES public.establishments(id),
  reason fiscal_action_reason NOT NULL,
  reason_details TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fiscal actions" ON public.fiscal_actions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fiscal actions" ON public.fiscal_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fiscal actions" ON public.fiscal_actions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- FISCAL DOCUMENTS (Peças Fiscais)
-- =====================================================
CREATE TABLE public.fiscal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_action_id UUID REFERENCES public.fiscal_actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  establishment_id UUID REFERENCES public.establishments(id),
  document_type document_type NOT NULL,
  document_number TEXT,
  status document_status NOT NULL DEFAULT 'draft',
  priority priority_level DEFAULT 'medium',
  
  -- Content fields (all editable until sent)
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  irregularities JSONB DEFAULT '[]',
  legislation_references JSONB DEFAULT '[]',
  
  -- Deadlines
  deadline_days INTEGER,
  deadline_date DATE,
  
  -- Financials (for Auto de Infração)
  fine_amount DECIMAL(12, 2),
  fine_uvf_quantity DECIMAL(10, 2),
  
  -- For Inutilização/Apreensão
  total_weight_kg DECIMAL(10, 3),
  seal_number TEXT,
  
  -- Interdiction type
  is_partial_interdiction BOOLEAN DEFAULT false,
  
  -- Photos/attachments stored in Lovable Cloud Storage
  attachments JSONB DEFAULT '[]',
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  sent_to TEXT, -- Name of recipient
  is_locked BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- PDF URL after generation
  pdf_url TEXT
);

ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.fiscal_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert documents" ON public.fiscal_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update unlocked documents" ON public.fiscal_documents
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id AND is_locked = false);

CREATE INDEX idx_fiscal_documents_user ON public.fiscal_documents(user_id);
CREATE INDEX idx_fiscal_documents_status ON public.fiscal_documents(status);
CREATE INDEX idx_fiscal_documents_deadline ON public.fiscal_documents(deadline_date);

-- =====================================================
-- TASKS (Pasta de Tarefas)
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_id UUID REFERENCES public.fiscal_documents(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES public.establishments(id),
  
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority priority_level NOT NULL DEFAULT 'medium',
  
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Notifications tracking
  notified_30_days BOOLEAN DEFAULT false,
  notified_7_days BOOLEAN DEFAULT false,
  notified_due BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- =====================================================
-- MONTHLY REPORTS (Relatório Mensal de Produtividade)
-- =====================================================
CREATE TABLE public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  
  -- Manual fields
  os_number TEXT,
  working_days INTEGER,
  total_km DECIMAL(10, 2),
  transportation_mode TEXT,
  
  -- Work schedule
  field_days INTEGER DEFAULT 0,
  internal_days INTEGER DEFAULT 0,
  duty_days INTEGER DEFAULT 0,
  
  -- Internal activities
  internal_activities JSONB DEFAULT '[]',
  
  -- Auto-calculated from fiscal_documents
  total_fiscalizations INTEGER DEFAULT 0,
  documents_summary JSONB DEFAULT '{}',
  
  -- Status
  status document_status NOT NULL DEFAULT 'draft',
  is_locked BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, month, year)
);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.monthly_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.monthly_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update unlocked reports" ON public.monthly_reports
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id AND is_locked = false);

-- =====================================================
-- CHECKLISTS (Templates por tipo de estabelecimento)
-- =====================================================
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  establishment_type TEXT NOT NULL, -- restaurante, supermercado, farmacia, etc
  items JSONB NOT NULL DEFAULT '[]',
  legislation_references JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view checklists" ON public.checklists
  FOR SELECT TO authenticated USING (true);

-- =====================================================
-- OFFLINE SYNC QUEUE
-- =====================================================
CREATE TABLE public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- insert, update, delete
  record_id UUID,
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync queue" ON public.offline_sync_queue
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_actions_updated_at
  BEFORE UPDATE ON public.fiscal_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_documents_updated_at
  BEFORE UPDATE ON public.fiscal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at
  BEFORE UPDATE ON public.monthly_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'fiscal');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to lock document when sent
CREATE OR REPLACE FUNCTION public.lock_document_on_send()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' AND OLD.status = 'draft' THEN
    NEW.is_locked = true;
    NEW.sent_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER lock_fiscal_document_on_send
  BEFORE UPDATE ON public.fiscal_documents
  FOR EACH ROW EXECUTE FUNCTION public.lock_document_on_send();

-- Function to create task when document with deadline is created
CREATE OR REPLACE FUNCTION public.create_task_for_document()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline_date IS NOT NULL THEN
    INSERT INTO public.tasks (
      user_id,
      document_id,
      establishment_id,
      title,
      description,
      priority,
      due_date
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.establishment_id,
      'Retorno: ' || NEW.document_type::text,
      'Verificar cumprimento de ' || NEW.document_type::text,
      NEW.priority,
      NEW.deadline_date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER create_task_on_document_deadline
  AFTER INSERT ON public.fiscal_documents
  FOR EACH ROW EXECUTE FUNCTION public.create_task_for_document();