-- Adicionar campo para data da fiscalização
ALTER TABLE public.fiscal_documents 
ADD COLUMN IF NOT EXISTS action_date date DEFAULT CURRENT_DATE;

-- Atualizar documentos existentes: usar a data de created_at como action_date
UPDATE public.fiscal_documents 
SET action_date = DATE(created_at)
WHERE action_date IS NULL;