import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { isSameDay, isToday, isThisWeek, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useColaboradores } from "./ColaboradoresContext";

export interface Agendamento {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  colaboradorId: string | null;
  data: Date;
  horario: string;
  duracao: string;
  servico: string;
  observacoes: string;
  status: string;
}

export const statusOptions = [
  { value: "agendado", label: "Agendado", color: "bg-primary" },
  { value: "confirmado", label: "Confirmado", color: "bg-blue-500" },
  { value: "realizado", label: "Realizado", color: "bg-success" },
  { value: "cancelado", label: "Cancelado", color: "bg-destructive" },
];

interface AgendaContextType {
  agendamentos: Agendamento[];
  isLoading: boolean;
  addAgendamento: (agendamento: Omit<Agendamento, "id">) => Promise<void>;
  updateAgendamento: (id: string, updates: Partial<Agendamento>) => Promise<void>;
  deleteAgendamento: (id: string) => Promise<void>;
  getAgendamentosForDay: (date: Date) => Agendamento[];
  stats: {
    total: number;
    agendados: number;
    confirmados: number;
    realizados: number;
    hoje: number;
    semana: number;
  };
  proximosAgendamentos: Agendamento[];
  agendamentosHoje: Agendamento[];
  refreshAgendamentos: () => Promise<void>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

const mapRowToAgendamento = (item: any): Agendamento => ({
  id: item.id,
  clienteNome: item.cliente_nome,
  clienteTelefone: item.cliente_telefone || "",
  colaboradorId: item.colaborador_id,
  data: parseISO(item.data),
  horario: item.horario,
  duracao: item.duracao || "60",
  servico: item.servico || "",
  observacoes: item.observacoes || "",
  status: item.status || "agendado",
});

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colaboradores } = useColaboradores();

  const fetchAgendamentos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;

      setAgendamentos((data || []).map(mapRowToAgendamento));
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
      toast.error("Erro ao carregar agendamentos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();

    const channel = supabase
      .channel('agenda-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapRowToAgendamento(payload.new);
            setAgendamentos((prev) => [...prev, newItem].sort((a, b) => a.data.getTime() - b.data.getTime()));
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapRowToAgendamento(payload.new);
            setAgendamentos((prev) =>
              prev.map((a) => (a.id === updatedItem.id ? updatedItem : a))
            );
          } else if (payload.eventType === 'DELETE') {
            setAgendamentos((prev) => prev.filter((a) => a.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addAgendamento = async (data: Omit<Agendamento, "id">) => {
    try {
      const { data: newEntry, error } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_nome: data.clienteNome,
          cliente_telefone: data.clienteTelefone,
          colaborador_id: data.colaboradorId,
          data: data.data.toISOString().split('T')[0],
          horario: data.horario,
          duracao: data.duracao,
          servico: data.servico,
          observacoes: data.observacoes,
          status: data.status,
        }])
        .select()
        .single();

      if (error) throw error;
      if (newEntry) {
        setAgendamentos(prev => [...prev, mapRowToAgendamento(newEntry)].sort((a, b) => a.data.getTime() - b.data.getTime()));
        toast.success("Agendamento criado!");
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao salvar agendamento.");
    }
  };

  const updateAgendamento = async (id: string, updates: Partial<Agendamento>) => {
    try {
      const supabaseUpdates: any = {};
      if (updates.clienteNome) supabaseUpdates.cliente_nome = updates.clienteNome;
      if (updates.clienteTelefone !== undefined) supabaseUpdates.cliente_telefone = updates.clienteTelefone;
      if (updates.colaboradorId !== undefined) supabaseUpdates.colaborador_id = updates.colaboradorId;
      if (updates.data) supabaseUpdates.data = updates.data.toISOString().split('T')[0];
      if (updates.horario) supabaseUpdates.horario = updates.horario;
      if (updates.duracao) supabaseUpdates.duracao = updates.duracao;
      if (updates.servico) supabaseUpdates.servico = updates.servico;
      if (updates.observacoes !== undefined) supabaseUpdates.observacoes = updates.observacoes;
      if (updates.status) supabaseUpdates.status = updates.status;

      const { data: updatedEntry, error } = await supabase
        .from('agendamentos')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (updatedEntry) {
        setAgendamentos(prev => prev.map(a => a.id === id ? mapRowToAgendamento(updatedEntry) : a));
      }
      toast.success("Agendamento atualizado.");
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  const deleteAgendamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAgendamentos(prev => prev.filter(a => a.id !== id));
      toast.success("Agendamento removido.");
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
      toast.error("Erro ao excluir agendamento.");
    }
  };

  const getAgendamentosForDay = (date: Date) => {
    return agendamentos.filter((ag) => isSameDay(ag.data, date));
  };

  const stats = useMemo(() => {
    const total = agendamentos.length;
    const agendados = agendamentos.filter((a) => a.status === "agendado").length;
    const confirmados = agendamentos.filter((a) => a.status === "confirmado").length;
    const realizados = agendamentos.filter((a) => a.status === "realizado").length;
    const hoje = agendamentos.filter((a) => isToday(a.data)).length;
    const semana = agendamentos.filter((a) => isThisWeek(a.data, { weekStartsOn: 1 })).length;

    return { total, agendados, confirmados, realizados, hoje, semana };
  }, [agendamentos]);

  const proximosAgendamentos = useMemo(() => {
    const now = new Date();
    return agendamentos
      .filter((a) => a.data >= now || isToday(a.data))
      .filter((a) => a.status !== "cancelado" && a.status !== "realizado")
      .slice(0, 5);
  }, [agendamentos]);

  const agendamentosHoje = useMemo(() => {
    return agendamentos.filter((a) => isToday(a.data));
  }, [agendamentos]);

  return (
    <AgendaContext.Provider
      value={{
        agendamentos,
        isLoading,
        addAgendamento,
        updateAgendamento,
        deleteAgendamento,
        getAgendamentosForDay,
        stats,
        proximosAgendamentos,
        agendamentosHoje,
        refreshAgendamentos: fetchAgendamentos
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (context === undefined) {
    throw new Error("useAgenda must be used within an AgendaProvider");
  }
  return context;
}

