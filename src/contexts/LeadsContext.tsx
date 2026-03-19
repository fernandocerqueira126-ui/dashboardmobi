import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

// Types
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  value: number;
  paidValue?: number;
  description?: string;
  date: string;
  source: string;
  status: string;
  isPaid?: boolean;
  tags?: string[];
  linkImovelInteresse?: string | null;
  ultimaMensagem?: string | null;
}

export type ColumnColor = string;

export interface Column {
  id: string;
  title: string;
  subtitle: string;
  color: ColumnColor;
}

// Default configuration with Hex Colors
export const defaultColumnConfig: Column[] = [
  { id: "novo", title: "Novo Lead", subtitle: "Primeiro contato", color: "#3B82F6" },
  { id: "contato", title: "Contato Inicial", subtitle: "Coletando informações", color: "#F97316" },
  { id: "visita", title: "Visita Marcada", subtitle: "Agendado, pendente confirmação", color: "#8B5CF6" },
  { id: "proposta", title: "Proposta Enviada", subtitle: "Proposta em análise", color: "#EAB308" },
  { id: "documentacao", title: "Documentação/Análise", subtitle: "Documentação em andamento", color: "#14B8A6" },
  { id: "ganho", title: "Fechado/Contrato", subtitle: "Contrato assinado", color: "#10B981" },
  { id: "perdido", title: "Perdido", subtitle: "Lead não convertido", color: "#EF4444" },
];

export const sourceOptions = [
  "Instagram",
  "WhatsApp",
  "Facebook",
  "Google Ads",
  "Indicação",
  "Site",
  "Outro",
];

interface LeadsContextType {
  leads: Lead[];
  isLoading: boolean;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  addLead: (lead: Omit<Lead, "id">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLeadToStatus: (id: string, newStatus: string) => Promise<void>;
  getLeadsByStatus: (status: string) => Lead[];
  stats: {
    total: number;
    pagos: number;
    faturado: number;
    estimado: number;
    conversao: number;
    ganhos: number;
    perdidos: number;
  };
  getLeadsBySource: (source: string) => Lead[];
  getLeadsByDateRange: (startDate: Date, endDate: Date) => Lead[];
  uniqueSources: string[];
  refreshLeads: () => Promise<void>;
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  addColumn: (column: Column) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (newColumns: Column[]) => void;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

type LeadRow = Database['public']['Tables']['leads']['Row'];

// Normalize status: map display titles back to column IDs
const normalizeStatus = (status: string): string => {
  const titleToId = defaultColumnConfig.reduce((acc, col) => {
    acc[col.title.toLowerCase()] = col.id;
    return acc;
  }, {} as Record<string, string>);
  
  const lower = status.toLowerCase();
  // If it matches a title, return the id
  if (titleToId[lower]) return titleToId[lower];
  // If it already matches an id, return as-is
  if (defaultColumnConfig.some(c => c.id === status)) return status;
  // Default
  return "novo";
};

// Helper function to map database row to UI Lead model
const mapRowToLead = (row: LeadRow): Lead => ({
  id: row.id,
  name: row.name,
  phone: row.phone || "",
  email: row.email || "",
  value: row.value || 0,
  paidValue: row.paid_value || 0,
  description: row.description || "",
  date: row.date,
  source: row.source === 'formulário' || !row.source ? "WhatsApp" : row.source,
  status: normalizeStatus(row.status || "novo"),
  isPaid: row.is_paid || false,
  tags: row.tags || [],
  linkImovelInteresse: row.link_imovel_interesse || null,
  ultimaMensagem: row.ultima_mensagem || null,
});

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem("kanban_columns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map: Record<string, string> = {
          blue: "#3B82F6", orange: "#F97316", purple: "#8B5CF6", 
          yellow: "#EAB308", teal: "#14B8A6", green: "#10B981", red: "#EF4444"
        };
        return parsed.map((c: Record<string, unknown>) => ({
          ...c,
          color: typeof c.color === 'string' ? (map[c.color] || (c.color.startsWith('#') ? c.color : "#3B82F6")) : "#3B82F6"
        })) as Column[];
      } catch (e) {
        return defaultColumnConfig;
      }
    }
    return defaultColumnConfig;
  });

  useEffect(() => {
    localStorage.setItem("kanban_columns", JSON.stringify(columns));
  }, [columns]);

  const addColumn = (column: Column) => {
    setColumns(prev => [...prev, column]);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
  };

  const reorderColumns = (newColumns: Column[]) => {
    setColumns(newColumns);
  };

  const fetchLeads = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads((data || []).map(mapRowToLead));
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      if (showLoading) toast.error("Erro ao carregar dados do banco.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(true);

    // Real-time integration
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Real-time change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newLead = mapRowToLead(payload.new as LeadRow);
            setLeads((prev) => {
              if (prev.some(l => l.id === newLead.id)) return prev;
              return [newLead, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedLead = mapRowToLead(payload.new as LeadRow);
            const oldStatus = (payload.old as any).status;

            setLeads((prev) =>
              prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
            );

            if (oldStatus && oldStatus !== updatedLead.status) {
              const column = columns.find(c => c.id === updatedLead.status);
              toast.success(`Lead movido para ${column?.title || updatedLead.status}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((lead) => lead.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    // Periodic refresh every 30s for sync guarantee
    const interval = setInterval(() => {
      fetchLeads();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [columns]); // added columns to dependency array

  const addLead = async (leadData: Omit<Lead, "id">) => {
    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([{
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          value: leadData.value,
          paid_value: leadData.paidValue,
          description: leadData.description,
          date: leadData.date,
          source: leadData.source,
          status: leadData.status,
          is_paid: leadData.isPaid,
          tags: leadData.tags,
          link_imovel_interesse: leadData.linkImovelInteresse,
          ultima_mensagem: leadData.ultimaMensagem,
        }])
        .select()
        .single();

      if (error) throw error;

      // Optimistic update to reflect immediately
      if (newLead) {
        setLeads((prev) => {
          const mapped = mapRowToLead(newLead as LeadRow);
          // Only add if it doesn't exist to prevent duplicates from real-time
          if (!prev.find(l => l.id === mapped.id)) {
            return [mapped, ...prev];
          }
          return prev;
        });
      }

      toast.success("Lead enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar lead:", error);
      toast.error("Falha ao salvar lead.");
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
      if (updates.email !== undefined) supabaseUpdates.email = updates.email;
      if (updates.value !== undefined) supabaseUpdates.value = updates.value;
      if (updates.paidValue !== undefined) supabaseUpdates.paid_value = updates.paidValue;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.date !== undefined) supabaseUpdates.date = updates.date;
      if (updates.source !== undefined) supabaseUpdates.source = updates.source;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.isPaid !== undefined) supabaseUpdates.is_paid = updates.isPaid;
      if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
      if (updates.linkImovelInteresse !== undefined) supabaseUpdates.link_imovel_interesse = updates.linkImovelInteresse;
      if (updates.ultimaMensagem !== undefined) supabaseUpdates.ultima_mensagem = updates.ultimaMensagem;

      // Optimistic update
      setLeads((prev) => 
        prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead)
      );

      const { error } = await supabase
        .from('leads')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) {
        // Rollback handled if needed, or just let error throw
        throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      toast.error("Erro ao salvar alterações.");
      // optionally could trigger a refetch here on failure
    }
  };

  const deleteLead = async (id: string) => {
    // Optimistic update
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        // Revert on error
        await fetchLeads();
        throw error;
      }
      toast.success("Lead removido.");
    } catch (error) {
      console.error("Erro ao deletar lead:", error);
      toast.error("Erro ao excluir lead.");
    }
  };

  const moveLeadToStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      // State updated by real-time subscription
    } catch (error) {
      console.error("Erro ao mover lead:", error);
      toast.error("Erro ao atualizar status.");
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const getLeadsBySource = (source: string) => {
    if (source === "todos") return leads;
    return leads.filter((lead) => lead.source === source);
  };

  const getLeadsByDateRange = (startDate: Date, endDate: Date) => {
    return leads.filter((lead) => {
      const leadDate = new Date(lead.date);
      return leadDate >= startDate && leadDate <= endDate;
    });
  };

  const uniqueSources = useMemo(() => {
    const sources = new Set(leads.map((lead) => lead.source));
    return Array.from(sources);
  }, [leads]);

  const stats = useMemo(() => {
    const total = leads.length;
    const pagos = leads.filter((l) => l.isPaid).length;
    const faturado = leads
      .filter((l) => l.isPaid)
      .reduce((acc, l) => acc + (l.paidValue || 0), 0);
    const estimado = leads.reduce((acc, l) => acc + l.value, 0);
    const ganhos = leads.filter((l) => l.status === "ganho").length;
    const perdidos = leads.filter((l) => l.status === "perdido").length;
    const conversao = total > 0 ? Math.round((ganhos / total) * 100) : 0;

    return { total, pagos, faturado, estimado, conversao, ganhos, perdidos };
  }, [leads]);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        isLoading,
        setLeads,
        addLead,
        updateLead,
        deleteLead,
        moveLeadToStatus,
        getLeadsByStatus,
        stats,
        getLeadsBySource,
        getLeadsByDateRange,
        uniqueSources,
        refreshLeads: fetchLeads,
        columns,
        setColumns,
        addColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
}


