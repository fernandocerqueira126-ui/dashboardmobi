import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNotifications } from "./NotificationsContext";

type AtendimentoRow = Database['public']['Tables']['atendimentos']['Row'];
type MensagemRow = Database['public']['Tables']['mensagens']['Row'];

export interface Atendimento {
  id: string;
  clienteId: string | null;
  clienteNome: string;
  clienteEmail?: string | null;
  clienteTelefone?: string | null;
  assunto: string;
  status: "aberto" | "em_andamento" | "resolvido";
  prioridade: "alta" | "media" | "baixa";
  colaborador?: string | null;
  origem: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  mensagens: Mensagem[];
}

export interface Mensagem {
  id: string;
  texto: string;
  remetente: "cliente" | "atendente";
  timestamp: Date;
}

interface AtendimentoInput {
  clienteId: string | null;
  clienteNome: string;
  clienteEmail?: string | null;
  clienteTelefone?: string | null;
  assunto: string;
  status: "aberto" | "em_andamento" | "resolvido";
  prioridade: "alta" | "media" | "baixa";
  colaborador?: string | null;
  origem: string | null;
}

interface AtendimentosContextType {
  atendimentos: Atendimento[];
  isLoading: boolean;
  addAtendimento: (atendimento: AtendimentoInput) => Promise<void>;
  updateAtendimento: (id: string, data: Partial<Atendimento>) => Promise<void>;
  deleteAtendimento: (id: string) => Promise<void>;
  addMensagem: (atendimentoId: string, mensagem: Omit<Mensagem, "id" | "timestamp">) => Promise<void>;
  getAtendimentosByCliente: (clienteId: string) => Atendimento[];
  stats: {
    abertos: number;
    emAndamento: number;
    resolvidos: number;
    tempoMedio: string;
  };
  refreshAtendimentos: () => Promise<void>;
}

const AtendimentosContext = createContext<AtendimentosContextType | undefined>(undefined);

const mapRowToAtendimento = (row: AtendimentoRow, mensagens: MensagemRow[] = []): Atendimento => ({
  id: row.id,
  clienteId: row.cliente_id,
  clienteNome: row.cliente_nome,
  assunto: row.assunto,
  status: (row.status as "aberto" | "em_andamento" | "resolvido") || "aberto",
  prioridade: (row.prioridade as "alta" | "media" | "baixa") || "media",
  colaborador: row.colaborador,
  origem: row.origem,
  criadoEm: new Date(row.created_at),
  atualizadoEm: new Date(row.updated_at),
  mensagens: mensagens.map(m => ({
    id: m.id,
    texto: m.texto,
    remetente: m.remetente as "cliente" | "atendente",
    timestamp: new Date(m.created_at)
  }))
});

export function AtendimentosProvider({ children }: { children: ReactNode }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  const fetchAtendimentos = async () => {
    setIsLoading(true);
    try {
      const { data: atendimentosData, error: atdError } = await supabase
        .from('atendimentos')
        .select('*, mensagens(*)');

      if (atdError) throw atdError;

      const formatted = (atendimentosData || []).map(row =>
        mapRowToAtendimento(row, (row as any).mensagens)
      );

      setAtendimentos(formatted);
    } catch (error) {
      console.error("Erro ao buscar atendimentos:", error);
      toast.error("Erro ao carregar atendimentos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAtendimentos();

    const channel = supabase
      .channel('atendimentos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atendimentos' }, () => {
        fetchAtendimentos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addAtendimento = async (data: AtendimentoInput) => {
    try {
      const { error } = await supabase
        .from('atendimentos')
        .insert([{
          cliente_id: data.clienteId,
          cliente_nome: data.clienteNome,
          assunto: data.assunto,
          status: data.status,
          prioridade: data.prioridade,
          colaborador: data.colaborador,
          origem: data.origem
        }]);

      if (error) throw error;

      addNotification({
        title: "Novo Atendimento",
        message: `Atendimento criado para ${data.clienteNome}`,
        type: "info",
      });

      fetchAtendimentos();
    } catch (error) {
      console.error("Erro ao criar atendimento:", error);
      toast.error("Erro ao salvar atendimento.");
    }
  };

  const updateAtendimento = async (id: string, data: Partial<Atendimento>) => {
    try {
      const updates: any = {};
      if (data.status) updates.status = data.status;
      if (data.prioridade) updates.prioridade = data.prioridade;
      if (data.colaborador !== undefined) updates.colaborador = data.colaborador;
      if (data.assunto) updates.assunto = data.assunto;

      const { error } = await supabase
        .from('atendimentos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      if (data.status === "resolvido") {
        addNotification({
          title: "Atendimento Resolvido",
          message: `O ticket foi concluído com sucesso.`,
          type: "success",
        });
      }
      fetchAtendimentos();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const deleteAtendimento = async (id: string) => {
    try {
      const { error } = await supabase.from('atendimentos').delete().eq('id', id);
      if (error) throw error;
      fetchAtendimentos();
    } catch (error) {
      console.error(error);
    }
  };

  const addMensagem = async (atendimentoId: string, mensagem: Omit<Mensagem, "id" | "timestamp">) => {
    try {
      const { error } = await supabase
        .from('mensagens')
        .insert([{
          atendimento_id: atendimentoId,
          texto: mensagem.texto,
          remetente: mensagem.remetente
        }]);

      if (error) throw error;
      fetchAtendimentos();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const getAtendimentosByCliente = (clienteId: string) => {
    return atendimentos.filter(atd => atd.clienteId === clienteId);
  };

  const stats = useMemo(() => {
    const abertos = atendimentos.filter(a => a.status === "aberto").length;
    const emAndamento = atendimentos.filter(a => a.status === "em_andamento").length;
    const resolvidos = atendimentos.filter(a => a.status === "resolvido").length;

    const resolvidosComTempo = atendimentos.filter(a => a.status === "resolvido");
    let tempoMedio = "N/A";

    if (resolvidosComTempo.length > 0) {
      const totalMinutos = resolvidosComTempo.reduce((acc, atd) => {
        const diff = atd.atualizadoEm.getTime() - atd.criadoEm.getTime();
        return acc + diff / 60000;
      }, 0);
      const media = Math.round(totalMinutos / resolvidosComTempo.length);
      tempoMedio = media < 60 ? `${media}min` : `${Math.round(media / 60)}h`;
    }

    return { abertos, emAndamento, resolvidos, tempoMedio };
  }, [atendimentos]);

  return (
    <AtendimentosContext.Provider
      value={{
        atendimentos,
        isLoading,
        addAtendimento,
        updateAtendimento,
        deleteAtendimento,
        addMensagem,
        getAtendimentosByCliente,
        stats,
        refreshAtendimentos: fetchAtendimentos
      }}
    >
      {children}
    </AtendimentosContext.Provider>
  );
}

export function useAtendimentos() {
  const context = useContext(AtendimentosContext);
  if (!context) {
    throw new Error("useAtendimentos must be used within an AtendimentosProvider");
  }
  return context;
}
