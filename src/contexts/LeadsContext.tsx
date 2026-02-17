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
}

// Column configuration
export const columnConfig = [
  { id: "novo", title: "Novo Lead", color: "blue" as const },
  { id: "contato", title: "Contato Inicial", color: "orange" as const },
  { id: "proposta", title: "Proposta Enviada", color: "purple" as const },
  { id: "negociacao", title: "Negociação", color: "yellow" as const },
  { id: "ganho", title: "Fechado Ganho", color: "green" as const },
  { id: "perdido", title: "Fechado Perdido", color: "red" as const },
];

export const sourceOptions = [
  "Instagram",
  "WhatsApp",
  "Facebook",
  "Google Ads",
  "Indicação",
  "Site",
  "LinkedIn",
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
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

type LeadRow = Database['public']['Tables']['leads']['Row'];

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
  status: row.status || "novo",
  isPaid: row.is_paid || false,
  tags: row.tags || [],
});

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads((data || []).map(mapRowToLead));
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao carregar dados do banco.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

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
            setLeads((prev) => [newLead, ...prev]);
            // Global notification handled in NotificationsContext
          } else if (payload.eventType === 'UPDATE') {
            const updatedLead = mapRowToLead(payload.new as LeadRow);
            const oldStatus = (payload.old as any).status;

            setLeads((prev) =>
              prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
            );

            // Notify status change if it moved columns
            if (oldStatus && oldStatus !== updatedLead.status) {
              const column = columnConfig.find(c => c.id === updatedLead.status);
              toast.success(`Lead movido para ${column?.title || updatedLead.status}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((lead) => lead.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addLead = async (leadData: Omit<Lead, "id">) => {
    try {
      const { data, error } = await supabase
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
        }])
        .select()
        .single();

      if (error) throw error;

      // Note: setLeads is handled by real-time subscription, 
      // but we could also update it here if we want immediate UI response 
      // before the DB confirms. For now, we rely on the subscription.
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

      const { error } = await supabase
        .from('leads')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) throw error;
      // State updated by real-time subscription
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      // State updated by real-time subscription
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


