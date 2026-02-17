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
      agendamentos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string | null
          colaborador_id: string | null
          created_at: string
          data: string
          duracao: string | null
          horario: string
          id: string
          lead_id: string | null
          observacoes: string | null
          servico: string | null
          status: string
        }
        Insert: {
          cliente_nome: string
          cliente_telefone?: string | null
          colaborador_id?: string | null
          created_at?: string
          data: string
          duracao?: string | null
          horario: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          servico?: string | null
          status?: string
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string | null
          colaborador_id?: string | null
          created_at?: string
          data?: string
          duracao?: string | null
          horario?: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          servico?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          assunto: string
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string
          cliente_telefone: string | null
          colaborador: string | null
          created_at: string
          id: string
          origem: string | null
          prioridade: string
          status: string
          updated_at: string
        }
        Insert: {
          assunto: string
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          colaborador?: string | null
          created_at?: string
          id?: string
          origem?: string | null
          prioridade?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          colaborador?: string | null
          created_at?: string
          id?: string
          origem?: string | null
          prioridade?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          date: string
          description: string | null
          email: string | null
          id: string
          is_paid: boolean | null
          link_imovel_interesse: string | null
          name: string
          paid_value: number | null
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          ultima_mensagem: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          link_imovel_interesse?: string | null
          name: string
          paid_value?: number | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          ultima_mensagem?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          link_imovel_interesse?: string | null
          name?: string
          paid_value?: number | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          ultima_mensagem?: string | null
          value?: number | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          atendimento_id: string
          created_at: string
          id: string
          remetente: string
          texto: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          id?: string
          remetente?: string
          texto: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          id?: string
          remetente?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
