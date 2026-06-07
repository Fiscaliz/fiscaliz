export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_company_profile: {
        Row: {
          area_of_practice: string | null
          created_at: string
          document_structure: Json | null
          documents_analyzed: number
          evidence_types: Json | null
          id: string
          last_trained_at: string | null
          profession: string | null
          report_format: Json | null
          report_types: string[] | null
          summary: string | null
          updated_at: string
          user_id: string
          vocabulary: Json | null
        }
        Insert: {
          area_of_practice?: string | null
          created_at?: string
          document_structure?: Json | null
          documents_analyzed?: number
          evidence_types?: Json | null
          id?: string
          last_trained_at?: string | null
          profession?: string | null
          report_format?: Json | null
          report_types?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id: string
          vocabulary?: Json | null
        }
        Update: {
          area_of_practice?: string | null
          created_at?: string
          document_structure?: Json | null
          documents_analyzed?: number
          evidence_types?: Json | null
          id?: string
          last_trained_at?: string | null
          profession?: string | null
          report_format?: Json | null
          report_types?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          vocabulary?: Json | null
        }
        Relationships: []
      }
      ai_training_documents: {
        Row: {
          analysis: Json | null
          created_at: string
          doc_type: Database["public"]["Enums"]["ai_training_doc_type"]
          error: string | null
          extracted_text: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          status: Database["public"]["Enums"]["ai_training_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["ai_training_doc_type"]
          error?: string | null
          extracted_text?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          status?: Database["public"]["Enums"]["ai_training_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["ai_training_doc_type"]
          error?: string | null
          extracted_text?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          status?: Database["public"]["Enums"]["ai_training_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          created_at: string
          establishment_type: string
          id: string
          is_active: boolean | null
          items: Json
          legislation_references: Json | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          establishment_type: string
          id?: string
          is_active?: boolean | null
          items?: Json
          legislation_references?: Json | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          establishment_type?: string
          id?: string
          is_active?: boolean | null
          items?: Json
          legislation_references?: Json | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      document_sequences: {
        Row: {
          created_at: string
          document_type: string
          id: string
          last_number: number
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          last_number?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      establishments: {
        Row: {
          alvara_numero: string | null
          alvara_validade: string | null
          bairro: string | null
          cep: string | null
          cnae_principal: string | null
          cnpj: string
          created_at: string
          created_by: string | null
          endereco: string
          id: string
          latitude: number | null
          longitude: number | null
          nome_fantasia: string | null
          razao_social: string
          responsavel_cpf: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          risk_level:
            | Database["public"]["Enums"]["establishment_risk_level"]
            | null
          updated_at: string
        }
        Insert: {
          alvara_numero?: string | null
          alvara_validade?: string | null
          bairro?: string | null
          cep?: string | null
          cnae_principal?: string | null
          cnpj: string
          created_at?: string
          created_by?: string | null
          endereco: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_fantasia?: string | null
          razao_social: string
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          risk_level?:
            | Database["public"]["Enums"]["establishment_risk_level"]
            | null
          updated_at?: string
        }
        Update: {
          alvara_numero?: string | null
          alvara_validade?: string | null
          bairro?: string | null
          cep?: string | null
          cnae_principal?: string | null
          cnpj?: string
          created_at?: string
          created_by?: string | null
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_fantasia?: string | null
          razao_social?: string
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          risk_level?:
            | Database["public"]["Enums"]["establishment_risk_level"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      evidence_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          position: number
          project_id: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
          project_id: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          ai_analysis: Json | null
          ai_status: string
          annotations: Json
          caption: string | null
          captured_at: string | null
          category_id: string | null
          created_at: string
          file_name: string | null
          finding: string | null
          height: number | null
          id: string
          mime_type: string | null
          observation: string | null
          position: number
          project_id: string
          risk_level: string | null
          storage_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_status?: string
          annotations?: Json
          caption?: string | null
          captured_at?: string | null
          category_id?: string | null
          created_at?: string
          file_name?: string | null
          finding?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          observation?: string | null
          position?: number
          project_id: string
          risk_level?: string | null
          storage_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_status?: string
          annotations?: Json
          caption?: string | null
          captured_at?: string | null
          category_id?: string | null
          created_at?: string
          file_name?: string | null
          finding?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          observation?: string | null
          position?: number
          project_id?: string
          risk_level?: string | null
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evidences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "evidence_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_actions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          establishment_id: string | null
          finished_at: string | null
          id: string
          reason: Database["public"]["Enums"]["fiscal_action_reason"]
          reason_details: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          establishment_id?: string | null
          finished_at?: string | null
          id?: string
          reason: Database["public"]["Enums"]["fiscal_action_reason"]
          reason_details?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          establishment_id?: string | null
          finished_at?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["fiscal_action_reason"]
          reason_details?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_actions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_documents: {
        Row: {
          action_date: string | null
          attachments: Json | null
          content: Json
          created_at: string
          deadline_date: string | null
          deadline_days: number | null
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          establishment_id: string | null
          fine_amount: number | null
          fine_uvf_quantity: number | null
          fiscal_action_id: string | null
          id: string
          irregularities: Json | null
          is_locked: boolean | null
          is_partial_interdiction: boolean | null
          legislation_references: Json | null
          pdf_url: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          seal_number: string | null
          sent_at: string | null
          sent_to: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string | null
          total_weight_kg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_date?: string | null
          attachments?: Json | null
          content?: Json
          created_at?: string
          deadline_date?: string | null
          deadline_days?: number | null
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          establishment_id?: string | null
          fine_amount?: number | null
          fine_uvf_quantity?: number | null
          fiscal_action_id?: string | null
          id?: string
          irregularities?: Json | null
          is_locked?: boolean | null
          is_partial_interdiction?: boolean | null
          legislation_references?: Json | null
          pdf_url?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          seal_number?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string | null
          total_weight_kg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_date?: string | null
          attachments?: Json | null
          content?: Json
          created_at?: string
          deadline_date?: string | null
          deadline_days?: number | null
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          establishment_id?: string | null
          fine_amount?: number | null
          fine_uvf_quantity?: number | null
          fiscal_action_id?: string | null
          id?: string
          irregularities?: Json | null
          is_locked?: boolean | null
          is_partial_interdiction?: boolean | null
          legislation_references?: Json | null
          pdf_url?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          seal_number?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string | null
          total_weight_kg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_documents_fiscal_action_id_fkey"
            columns: ["fiscal_action_id"]
            isOneToOne: false
            referencedRelation: "fiscal_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          created_at: string
          days_to_work: number | null
          documents_summary: Json | null
          duty_days: number | null
          field_days: number | null
          id: string
          internal_activities: Json | null
          internal_days: number | null
          is_locked: boolean | null
          license_attachment_url: string | null
          license_end_date: string | null
          license_start_date: string | null
          license_type: string | null
          month: number
          os_number: string | null
          pdf_url: string | null
          pfe_days: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          total_fiscalizations: number | null
          total_km: number | null
          transportation_mode: string | null
          updated_at: string
          user_id: string
          working_days: number | null
          year: number
        }
        Insert: {
          created_at?: string
          days_to_work?: number | null
          documents_summary?: Json | null
          duty_days?: number | null
          field_days?: number | null
          id?: string
          internal_activities?: Json | null
          internal_days?: number | null
          is_locked?: boolean | null
          license_attachment_url?: string | null
          license_end_date?: string | null
          license_start_date?: string | null
          license_type?: string | null
          month: number
          os_number?: string | null
          pdf_url?: string | null
          pfe_days?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          total_fiscalizations?: number | null
          total_km?: number | null
          transportation_mode?: string | null
          updated_at?: string
          user_id: string
          working_days?: number | null
          year: number
        }
        Update: {
          created_at?: string
          days_to_work?: number | null
          documents_summary?: Json | null
          duty_days?: number | null
          field_days?: number | null
          id?: string
          internal_activities?: Json | null
          internal_days?: number | null
          is_locked?: boolean | null
          license_attachment_url?: string | null
          license_end_date?: string | null
          license_start_date?: string | null
          license_type?: string | null
          month?: number
          os_number?: string | null
          pdf_url?: string | null
          pfe_days?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          total_fiscalizations?: number | null
          total_km?: number | null
          transportation_mode?: string | null
          updated_at?: string
          user_id?: string
          working_days?: number | null
          year?: number
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          created_at: string
          data: Json
          id: string
          operation: string
          record_id: string | null
          synced: boolean | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          operation: string
          record_id?: string | null
          synced?: boolean | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          operation?: string
          record_id?: string | null
          synced?: boolean | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          areas_of_practice: string[] | null
          avatar_url: string | null
          city: string | null
          created_at: string
          custom_legislations: Json | null
          division: string | null
          email: string | null
          full_name: string
          id: string
          institution_logo_url: string | null
          institution_name: string | null
          institutional_link: string | null
          is_active: boolean
          organ_name: string | null
          pdf_header_text: string | null
          phone: string | null
          registration_number: string | null
          signature_url: string | null
          state: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          areas_of_practice?: string[] | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          custom_legislations?: Json | null
          division?: string | null
          email?: string | null
          full_name: string
          id: string
          institution_logo_url?: string | null
          institution_name?: string | null
          institutional_link?: string | null
          is_active?: boolean
          organ_name?: string | null
          pdf_header_text?: string | null
          phone?: string | null
          registration_number?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          areas_of_practice?: string[] | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          custom_legislations?: Json | null
          division?: string | null
          email?: string | null
          full_name?: string
          id?: string
          institution_logo_url?: string | null
          institution_name?: string | null
          institutional_link?: string | null
          is_active?: boolean
          organ_name?: string | null
          pdf_header_text?: string | null
          phone?: string | null
          registration_number?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: Database["public"]["Enums"]["project_area"]
          client: string | null
          created_at: string
          custom_area: string | null
          description: string | null
          id: string
          metadata: Json
          name: string
          project_date: string
          responsible_name: string | null
          responsible_registration: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["project_area"]
          client?: string | null
          created_at?: string
          custom_area?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          project_date?: string
          responsible_name?: string | null
          responsible_registration?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["project_area"]
          client?: string | null
          created_at?: string
          custom_area?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          project_date?: string
          responsible_name?: string | null
          responsible_registration?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          blocks: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          metadata: Json | null
          project_id: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          document_id: string | null
          due_date: string | null
          establishment_id: string | null
          id: string
          notified_30_days: boolean | null
          notified_7_days: boolean | null
          notified_due: boolean | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          establishment_id?: string | null
          id?: string
          notified_30_days?: boolean | null
          notified_7_days?: boolean | null
          notified_due?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          establishment_id?: string | null
          id?: string
          notified_30_days?: boolean | null
          notified_7_days?: boolean | null
          notified_due?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_document_number: {
        Args: { p_document_type: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_training_doc_type:
        | "relatorio"
        | "laudo"
        | "procedimento"
        | "norma"
        | "checklist"
        | "modelo_interno"
        | "outro"
      ai_training_status: "pending" | "processing" | "completed" | "failed"
      app_role: "admin" | "fiscal" | "gestor"
      document_status: "draft" | "sent" | "archived"
      document_type:
        | "termo_intimacao"
        | "visita_fiscal"
        | "auto_infracao"
        | "advertencia"
        | "inutilizacao"
        | "apreensao"
        | "interdicao"
        | "relatorio_tecnico"
        | "notificacao"
        | "replica"
        | "certidao"
        | "coleta_amostra"
        | "relatorio_atividade"
      establishment_risk_level: "I" | "II" | "III"
      fiscal_action_reason:
        | "denuncia"
        | "rotina"
        | "relatorio_tecnico"
        | "investigativa"
        | "demanda_chefia"
        | "surto"
        | "operacao_conjunta"
        | "coleta"
        | "demanda_especifica"
        | "outros"
        | "demanda_interna"
        | "pfe"
      priority_level: "high" | "medium" | "low"
      project_area:
        | "fiscalizacao_sanitaria"
        | "engenharia"
        | "arquitetura"
        | "seguranca_trabalho"
        | "auditoria"
        | "pericia_veicular"
        | "seguros"
        | "agronegocio"
        | "personalizado"
      project_status:
        | "planejamento"
        | "em_andamento"
        | "em_revisao"
        | "concluido"
        | "arquivado"
      task_status: "pending" | "in_progress" | "completed" | "overdue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_training_doc_type: [
        "relatorio",
        "laudo",
        "procedimento",
        "norma",
        "checklist",
        "modelo_interno",
        "outro",
      ],
      ai_training_status: ["pending", "processing", "completed", "failed"],
      app_role: ["admin", "fiscal", "gestor"],
      document_status: ["draft", "sent", "archived"],
      document_type: [
        "termo_intimacao",
        "visita_fiscal",
        "auto_infracao",
        "advertencia",
        "inutilizacao",
        "apreensao",
        "interdicao",
        "relatorio_tecnico",
        "notificacao",
        "replica",
        "certidao",
        "coleta_amostra",
        "relatorio_atividade",
      ],
      establishment_risk_level: ["I", "II", "III"],
      fiscal_action_reason: [
        "denuncia",
        "rotina",
        "relatorio_tecnico",
        "investigativa",
        "demanda_chefia",
        "surto",
        "operacao_conjunta",
        "coleta",
        "demanda_especifica",
        "outros",
        "demanda_interna",
        "pfe",
      ],
      priority_level: ["high", "medium", "low"],
      project_area: [
        "fiscalizacao_sanitaria",
        "engenharia",
        "arquitetura",
        "seguranca_trabalho",
        "auditoria",
        "pericia_veicular",
        "seguros",
        "agronegocio",
        "personalizado",
      ],
      project_status: [
        "planejamento",
        "em_andamento",
        "em_revisao",
        "concluido",
        "arquivado",
      ],
      task_status: ["pending", "in_progress", "completed", "overdue"],
    },
  },
} as const
