export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            leads: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    email: string | null
                    value: number
                    paid_value: number | null
                    description: string | null
                    date: string
                    source: string | null
                    status: string | null
                    is_paid: boolean | null
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    value?: number
                    paid_value?: number | null
                    description?: string | null
                    date?: string
                    source?: string | null
                    status?: string | null
                    is_paid?: boolean | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    value?: number
                    paid_value?: number | null
                    description?: string | null
                    date?: string
                    source?: string | null
                    status?: string | null
                    is_paid?: boolean | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            colaboradores: {
                Row: {
                    id: string
                    nome: string
                    email: string | null
                    telefone: string | null
                    cargo: string | null
                    status: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    email?: string | null
                    telefone?: string | null
                    cargo?: string | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    email?: string | null
                    telefone?: string | null
                    cargo?: string | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            clientes: {
                Row: {
                    id: string
                    lead_id: string | null
                    name: string
                    email: string | null
                    phone: string | null
                    total_spent: number
                    status: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lead_id?: string | null
                    name: string
                    email?: string | null
                    phone?: string | null
                    total_spent?: number
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    lead_id?: string | null
                    name?: string
                    email?: string | null
                    phone?: string | null
                    total_spent?: number
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            agendamentos: {
                Row: {
                    id: string
                    cliente_nome: string
                    cliente_telefone: string | null
                    colaborador_id: string | null
                    data: string
                    horario: string
                    duracao: string | null
                    servico: string | null
                    observacoes: string | null
                    status: string | null
                    google_event_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    cliente_nome: string
                    cliente_telefone?: string | null
                    colaborador_id?: string | null
                    data: string
                    horario: string
                    duracao?: string | null
                    servico?: string | null
                    observacoes?: string | null
                    status?: string | null
                    google_event_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    cliente_nome?: string
                    cliente_telefone?: string | null
                    colaborador_id?: string | null
                    data?: string
                    horario?: string
                    duracao?: string | null
                    servico?: string | null
                    observacoes?: string | null
                    status?: string | null
                    google_event_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            atendimentos: {
                Row: {
                    id: string
                    cliente_id: string | null
                    cliente_nome: string
                    assunto: string
                    status: string | null
                    prioridade: string | null
                    colaborador: string | null
                    origem: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    cliente_id?: string | null
                    cliente_nome: string
                    assunto: string
                    status?: string | null
                    prioridade?: string | null
                    colaborador?: string | null
                    origem?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    cliente_id?: string | null
                    cliente_nome?: string
                    assunto?: string
                    status?: string | null
                    prioridade?: string | null
                    colaborador?: string | null
                    origem?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            mensagens: {
                Row: {
                    id: string
                    atendimento_id: string
                    texto: string
                    remetente: string
                    timestamp: string
                }
                Insert: {
                    id?: string
                    atendimento_id: string
                    texto: string
                    remetente: string
                    timestamp?: string
                }
                Update: {
                    id?: string
                    atendimento_id?: string
                    texto?: string
                    remetente?: string
                    timestamp?: string
                }
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
