import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { format, subDays, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

export interface Transacao {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  status: "confirmado" | "pendente" | "cancelado";
  observacao?: string;
}

export const categoriasReceita = [
  "Setup de Automação",
  "Desenvolvimento de Bot/IA",
  "Consultoria Estratégica",
  "Gestão de Tráfego",
  "Fee Mensal (Retainer)",
  "Outros / Diversos",
];

export const categoriasDespesa = [
  "Folha de Pagamento / Freelancers",
  "Serviços e VPS",
  "Anúncios (Meta / Google Ads)",
  "Api & Softwares (OpenAI/Painel de Ferramentas)",
  "Outros / Diversos",
];

const initialTransacoes: Transacao[] = [
  {
    id: "1",
    tipo: "receita",
    descricao: "Setup Automação - Cliente ABC",
    valor: 2500,
    categoria: "Setup de Automação",
    data: format(subDays(new Date(), 2), "yyyy-MM-dd"),
    status: "confirmado",
  },
  {
    id: "2",
    tipo: "receita",
    descricao: "Desenvolvimento Bot WhatsApp - Empresa XYZ",
    valor: 4800,
    categoria: "Desenvolvimento de Bot/IA",
    data: format(subDays(new Date(), 5), "yyyy-MM-dd"),
    status: "confirmado",
  },
  {
    id: "3",
    tipo: "despesa",
    descricao: "Google Ads - Campanha Janeiro",
    valor: 3500,
    categoria: "Anúncios (Meta / Google Ads)",
    data: format(subDays(new Date(), 1), "yyyy-MM-dd"),
    status: "confirmado",
  },
  {
    id: "4",
    tipo: "receita",
    descricao: "Fee Mensal - Cliente Premium",
    valor: 1500,
    categoria: "Fee Mensal (Retainer)",
    data: format(new Date(), "yyyy-MM-dd"),
    status: "pendente",
  },
  {
    id: "5",
    tipo: "despesa",
    descricao: "OpenAI API - Consumo Mensal",
    valor: 280,
    categoria: "Api & Softwares (OpenAI/Painel de Ferramentas)",
    data: format(subDays(new Date(), 3), "yyyy-MM-dd"),
    status: "confirmado",
  },
];

interface FinanceiroContextType {
  transacoes: Transacao[];
  setTransacoes: React.Dispatch<React.SetStateAction<Transacao[]>>;
  addTransacao: (transacao: Omit<Transacao, "id">) => void;
  updateTransacao: (id: string, updates: Partial<Transacao>) => void;
  deleteTransacao: (id: string) => void;
  stats: {
    faturamento: number;
    despesas: number;
    lucro: number;
    saldo: number;
    ticket: number;
    cac: number;
    totalReceitas: number;
    totalDespesas: number;
  };
  recentTransacoes: Transacao[];
}

const FinanceiroContext = createContext<FinanceiroContextType | undefined>(undefined);

export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const [transacoes, setTransacoes] = useState<Transacao[]>(initialTransacoes);

  const addTransacao = (transacaoData: Omit<Transacao, "id">) => {
    const newTransacao: Transacao = {
      ...transacaoData,
      id: Date.now().toString(),
    };
    setTransacoes((prev) => [...prev, newTransacao]);
  };

  const updateTransacao = (id: string, updates: Partial<Transacao>) => {
    setTransacoes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransacao = (id: string) => {
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  // Stats for current month
  const stats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const monthTransacoes = transacoes.filter((t) => {
      const transactionDate = parseISO(t.data);
      return isWithinInterval(transactionDate, { start, end });
    });
    
    const confirmed = monthTransacoes.filter((t) => t.status === "confirmado");
    const faturamento = confirmed
      .filter((t) => t.tipo === "receita")
      .reduce((acc, t) => acc + t.valor, 0);
    const despesas = confirmed
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => acc + t.valor, 0);
    const lucro = faturamento - despesas;
    const saldo = faturamento - despesas;

    const totalReceitas = confirmed.filter((t) => t.tipo === "receita").length;
    const totalDespesas = confirmed.filter((t) => t.tipo === "despesa").length;

    const ticket = totalReceitas > 0 ? faturamento / totalReceitas : 0;
    const cac = totalReceitas > 0 ? despesas / totalReceitas : 0;

    return {
      faturamento,
      despesas,
      lucro,
      saldo,
      ticket,
      cac,
      totalReceitas,
      totalDespesas,
    };
  }, [transacoes]);

  const recentTransacoes = useMemo(() => {
    return [...transacoes]
      .sort((a, b) => parseISO(b.data).getTime() - parseISO(a.data).getTime())
      .slice(0, 5);
  }, [transacoes]);

  return (
    <FinanceiroContext.Provider
      value={{
        transacoes,
        setTransacoes,
        addTransacao,
        updateTransacao,
        deleteTransacao,
        stats,
        recentTransacoes,
      }}
    >
      {children}
    </FinanceiroContext.Provider>
  );
}

export function useFinanceiro() {
  const context = useContext(FinanceiroContext);
  if (context === undefined) {
    throw new Error("useFinanceiro must be used within a FinanceiroProvider");
  }
  return context;
}
