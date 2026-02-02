-- Adicionar relatorio_atividade ao enum document_type
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'relatorio_atividade';

-- Adicionar demanda_interna ao enum fiscal_action_reason (se não existir)
ALTER TYPE fiscal_action_reason ADD VALUE IF NOT EXISTS 'demanda_interna';