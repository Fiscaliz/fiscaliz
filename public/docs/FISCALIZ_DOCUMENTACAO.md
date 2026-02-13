# Fiscaliz - Documentação Técnica Consolidada

## 1. Visão Geral

O **Fiscaliz** é um sistema de gestão de fiscalização sanitária voltado para auditores fiscais e consultores privados. Permite criar, gerenciar e enviar documentos fiscais, controlar estabelecimentos, gerar relatórios mensais e acompanhar tarefas/prazos.

**Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase (Lovable Cloud)

**URL publicada:** https://fiscaliz.lovable.app

---

## 2. Estrutura de Páginas e Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Home | Tela inicial |
| `/auth` | Auth | Login e cadastro |
| `/dashboard` | Dashboard | Painel principal com resumos |
| `/nova-acao` | NewAction | Fluxo de criação de ação fiscal |
| `/documentos` | Documents | Lista de documentos fiscais |
| `/documentos/:id` | DocumentDetail | Detalhes de um documento |
| `/estabelecimentos` | Establishments | Gestão de estabelecimentos |
| `/tarefas` | Tasks | Gestão de tarefas e prazos |
| `/relatorios-mensais` | MonthlyReports | Lista de relatórios mensais |
| `/relatorio-mensal/:id` | MonthlyReport | Detalhes do relatório mensal |
| `/perfil` | Profile | Perfil do usuário |
| `/editar-perfil` | EditProfile | Edição de perfil |
| `/configuracoes` | Settings | Configurações |
| `/consultar-ia` | ConsultAI | Consulta de legislação via IA |
| `/admin/usuarios` | AdminUsers | Gestão de usuários (admin) |
| `/documento-publico/:id` | PublicDocumentView | Visualização pública via QR Code |

---

## 3. Funcionalidades Principais

### 3.1 Autenticação e Perfil
- Cadastro com distinção entre "Auditor Fiscal / Servidor Público" e "Consultor Privado"
- Captura de vínculo institucional (Município, Estado ou Empresa)
- Upload de logomarca institucional
- Áreas de atuação configuráveis
- Identificação por CPF e CNPJ

### 3.2 Ação Fiscal (Fluxo Principal)
O fluxo de criação de ação fiscal segue etapas:
1. **Seleção do motivo** (denúncia, rotina, demanda de chefia, surto, etc.)
2. **Identificação do estabelecimento** (manual, CNAE via IA, ou peças anteriores)
3. **Seleção do tipo de documento**
4. **Preenchimento do documento**
5. **Salvamento como rascunho → Envio (bloqueio definitivo)**

### 3.3 Tipos de Documentos Fiscais
| Tipo | Enum | Descrição |
|------|------|-----------|
| Termo de Intimação | `termo_intimacao` | Intimação para cumprimento |
| Visita Fiscal | `visita_fiscal` | Registro de visita |
| Auto de Infração | `auto_infracao` | Autuação por infração |
| Advertência | `advertencia` | Advertência formal |
| Inutilização | `inutilizacao` | Termo de inutilização |
| Apreensão | `apreensao` | Termo de apreensão |
| Interdição | `interdicao` | Interdição total ou parcial |
| Relatório Técnico | `relatorio_tecnico` | Relatório descritivo |
| Notificação | `notificacao` | Notificação ao fiscalizado |
| Réplica | `replica` | Réplica de documento |
| Certidão | `certidao` | Certidão fiscal |
| Coleta de Amostra | `coleta_amostra` | Termo de coleta |
| Relatório de Atividade | `relatorio_atividade` | Relatório mensal |

### 3.4 Ciclo de Vida dos Documentos
- **Rascunho (draft):** 100% editável, incluindo data, hora e observações
- **Salvar PDF:** Download para impressão sem bloquear
- **Envio (sent):** Bloqueio definitivo (`is_locked = true`), registra timestamp
- **Exclusão:** Permitida apenas para rascunhos
- **Canais de envio:** SIFIZ, E-mail, WhatsApp, QR Code

### 3.5 Estabelecimentos
- Cadastro com CNPJ, razão social, endereço, CNAE
- CNAE determina automaticamente o Grau de Risco (I, II ou III) pela tabela Anvisa (IN 66/2020)
- Busca resiliente por CNPJ
- Persistência automática via localStorage para rascunhos

### 3.6 Relatórios Mensais
- Controle de dias trabalhados, km percorridos
- Dias de campo, internos, plantão, PFE
- Atividades internas e resumo de documentos
- Licenças com anexo
- Modo de transporte e número de OS

### 3.7 Tarefas
- Criadas automaticamente a partir de documentos com prazo
- Prioridade: alta, média, baixa
- Status: pendente, em andamento, concluída, atrasada
- Notificações em 30 dias, 7 dias e no vencimento

### 3.8 Consulta IA
- Consulta de legislação sanitária via IA
- Análise de fotos de fiscalização
- Extração de dados de alvará

---

## 4. Schema do Banco de Dados

### 4.1 Tabela: `profiles`
Dados complementares do usuário autenticado.

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | — |
| full_name | text | Sim | — |
| email | text | Não | — |
| registration_number | text | Não | — |
| division | text | Não | — |
| phone | text | Não | — |
| avatar_url | text | Não | — |
| signature_url | text | Não | — |
| user_type | text | Não | — |
| institutional_link | text | Não | — |
| institution_name | text | Não | — |
| institution_logo_url | text | Não | — |
| areas_of_practice | text[] | Não | — |
| is_active | boolean | Sim | true |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**RLS:** Usuários veem/editam apenas o próprio perfil. Admins veem/editam todos.

### 4.2 Tabela: `establishments`
Estabelecimentos fiscalizados.

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | gen_random_uuid() |
| cnpj | text | Sim | — |
| razao_social | text | Sim | — |
| nome_fantasia | text | Não | — |
| endereco | text | Sim | — |
| bairro | text | Não | — |
| cep | text | Não | — |
| responsavel_nome | text | Não | — |
| responsavel_cpf | text | Não | — |
| responsavel_telefone | text | Não | — |
| cnae_principal | text | Não | — |
| risk_level | enum (I, II, III) | Não | II |
| alvara_numero | text | Não | — |
| alvara_validade | date | Não | — |
| latitude | numeric | Não | — |
| longitude | numeric | Não | — |
| created_by | uuid | Não | — |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**RLS:** Todos autenticados podem visualizar. Inserção vinculada ao criador. Edição pelo criador ou admin.

### 4.3 Tabela: `fiscal_actions`
Ações fiscais (visitas a estabelecimentos).

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | gen_random_uuid() |
| user_id | uuid | Sim | — |
| establishment_id | uuid (FK) | Não | — |
| reason | enum | Sim | — |
| reason_details | text | Não | — |
| started_at | timestamptz | Sim | now() |
| finished_at | timestamptz | Não | — |
| duration_minutes | integer | Não | — |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**Motivos (reason):** denuncia, rotina, relatorio_tecnico, investigativa, demanda_chefia, surto, operacao_conjunta, coleta, demanda_especifica, outros, demanda_interna, pfe

**RLS:** CRUD restrito ao próprio usuário. Sem permissão de DELETE.

### 4.4 Tabela: `fiscal_documents`
Documentos fiscais gerados nas ações.

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | gen_random_uuid() |
| fiscal_action_id | uuid (FK) | Não | — |
| user_id | uuid | Sim | — |
| establishment_id | uuid (FK) | Não | — |
| document_type | enum | Sim | — |
| document_number | text | Não | — |
| title | text | Não | — |
| status | enum (draft/sent/archived) | Sim | draft |
| priority | enum (high/medium/low) | Não | medium |
| content | jsonb | Sim | {} |
| irregularities | jsonb | Não | [] |
| legislation_references | jsonb | Não | [] |
| attachments | jsonb | Não | [] |
| action_date | date | Não | CURRENT_DATE |
| deadline_days | integer | Não | — |
| deadline_date | date | Não | — |
| fine_amount | numeric | Não | — |
| fine_uvf_quantity | numeric | Não | — |
| total_weight_kg | numeric | Não | — |
| is_partial_interdiction | boolean | Não | false |
| seal_number | text | Não | — |
| is_locked | boolean | Não | false |
| sent_at | timestamptz | Não | — |
| sent_to | text | Não | — |
| pdf_url | text | Não | — |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**RLS:** Usuário vê/insere/atualiza os próprios. Update apenas se `is_locked = false`. Delete apenas se `status = draft`. Documentos `sent`/`archived` são acessíveis publicamente (QR Code).

### 4.5 Tabela: `tasks`
Tarefas geradas automaticamente ou manualmente.

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | gen_random_uuid() |
| user_id | uuid | Sim | — |
| document_id | uuid (FK) | Não | — |
| establishment_id | uuid (FK) | Não | — |
| title | text | Sim | — |
| description | text | Não | — |
| status | enum (pending/in_progress/completed/overdue) | Sim | pending |
| priority | enum (high/medium/low) | Sim | medium |
| due_date | date | Não | — |
| completed_at | timestamptz | Não | — |
| notified_30_days | boolean | Não | false |
| notified_7_days | boolean | Não | false |
| notified_due | boolean | Não | false |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**RLS:** CRUD completo restrito ao próprio usuário.

### 4.6 Tabela: `monthly_reports`
Relatórios mensais de atividades.

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| id | uuid (PK) | Sim | gen_random_uuid() |
| user_id | uuid | Sim | — |
| month | integer | Sim | — |
| year | integer | Sim | — |
| working_days | integer | Não | — |
| days_to_work | integer | Não | — |
| field_days | integer | Não | 0 |
| internal_days | integer | Não | 0 |
| duty_days | integer | Não | 0 |
| pfe_days | integer | Não | 0 |
| total_km | numeric | Não | — |
| total_fiscalizations | integer | Não | 0 |
| internal_activities | jsonb | Não | [] |
| documents_summary | jsonb | Não | {} |
| transportation_mode | text | Não | — |
| os_number | text | Não | — |
| license_type | text | Não | — |
| license_start_date | date | Não | — |
| license_end_date | date | Não | — |
| license_attachment_url | text | Não | — |
| status | enum (draft/sent/archived) | Sim | draft |
| is_locked | boolean | Não | false |
| sent_at | timestamptz | Não | — |
| pdf_url | text | Não | — |
| created_at | timestamptz | Sim | now() |
| updated_at | timestamptz | Sim | now() |

**RLS:** Inserção/visualização pelo próprio usuário. Update apenas se `is_locked = false`. Sem DELETE.

### 4.7 Tabela: `user_roles`
Controle de permissões.

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid (PK) | gen_random_uuid() |
| user_id | uuid | — |
| role | enum (admin/fiscal/gestor) | fiscal |
| created_at | timestamptz | now() |

**RLS:** Usuários veem apenas seus próprios roles. Admins têm CRUD completo.

### 4.8 Tabela: `document_sequences`
Sequência numérica dos documentos.

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid (PK) | gen_random_uuid() |
| document_type | text | — |
| prefix | text | — |
| last_number | integer | 0 |

**RLS:** Apenas leitura para autenticados. Atualização via função `get_next_document_number()`.

### 4.9 Tabela: `checklists`
Checklists de fiscalização por tipo de estabelecimento.

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid (PK) | gen_random_uuid() |
| name | text | — |
| establishment_type | text | — |
| items | jsonb | [] |
| legislation_references | jsonb | [] |
| is_active | boolean | true |

**RLS:** Leitura para todos autenticados. Sem inserção/edição/exclusão via cliente.

---

## 5. Funções de Banco de Dados

### `get_next_document_number(p_document_type text)`
Gera número sequencial para documentos (exceto relatórios). Formato: `PREFIX-000001`.

### `has_role(_user_id uuid, _role app_role)`
Verifica se um usuário possui determinado papel.

### `handle_new_user()`
Trigger: ao criar usuário, insere perfil e atribui role `fiscal`.

### `lock_document_on_send()`
Trigger: ao mudar status para `sent`, define `is_locked = true` e `sent_at = now()`.

### `create_task_for_document()`
Trigger: ao criar documento com `deadline_date`, gera tarefa automaticamente.

---

## 6. Edge Functions (Backend)

| Função | Descrição |
|--------|-----------|
| `analyze-photos` | Análise de fotos de fiscalização via IA |
| `consult-legislation` | Consulta de legislação sanitária via IA |
| `extract-alvara-data` | Extração de dados de alvará via IA |
| `extract-fiscal-document-data` | Extração de dados de documentos fiscais |
| `send-fiscal-document` | Envio de documento fiscal por e-mail |

---

## 7. Armazenamento

- **Bucket:** `fiscal-photos` (público para acesso via QR Code)
- **Isolamento:** Path deve começar com UUID do usuário
- **Acesso:** URLs assinadas de curta duração
- **RLS no banco:** Documentos públicos apenas com status `sent` ou `archived`

---

## 8. Segurança (LGPD)

- Row Level Security (RLS) em todas as tabelas
- Isolamento de dados por usuário
- Documentos bloqueados após envio (imutabilidade)
- Acesso público controlado apenas para documentos enviados
- Roles: admin, fiscal, gestor
- Conformidade com LGPD para dados sensíveis
