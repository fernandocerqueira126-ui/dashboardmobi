import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  MessageCircle,
  Calendar,
  UserCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  TrendingDown,
  Wallet,
  Target,
  Award,
  RefreshCw,
  CheckCircle,
  TestTube,
} from "lucide-react";
import { useLeads, sourceOptions } from "@/contexts/LeadsContext";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type PeriodPreset = "7dias" | "30dias" | "90dias" | "mes" | "custom";

export default function Relatorios() {
  const leadsCtx = useLeads();
  const { leads, stats: globalStats } = leadsCtx;
  const { transacoes, stats: finStats } = useFinanceiro();

  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [filterSource, setFilterSource] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>("30dias");

  const handlePeriodPreset = (preset: PeriodPreset) => {
    setActivePeriod(preset);
    const today = new Date();
    switch (preset) {
      case "7dias":
        setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "30dias":
        setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "90dias":
        setStartDate(format(subDays(today, 90), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "mes":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
    }
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const leadDate = parseISO(lead.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const matchesDate = isWithinInterval(leadDate, { start, end });
      const matchesSource = filterSource === "todos" || lead.source === filterSource;
      const matchesStatus = filterStatus === "todos" || lead.status === filterStatus;
      return matchesDate && matchesSource && matchesStatus;
    });
  }, [leads, startDate, endDate, filterSource, filterStatus]);

  // Filtered financial transactions
  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      const tDate = parseISO(t.data);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return isWithinInterval(tDate, { start, end });
    });
  }, [transacoes, startDate, endDate]);

  // Lead stats
  const leadStats = useMemo(() => {
    const total = filteredLeads.length;
    const respondidos = filteredLeads.filter((l) => l.status !== "novo").length;
    const agendados = filteredLeads.filter((l) =>
      ["visita", "proposta", "documentacao", "ganho", "perdido"].includes(l.status)
    ).length;
    const pagos = filteredLeads.filter((l) => l.isPaid).length;
    const ganhos = filteredLeads.filter((l) => l.status === "ganho").length;
    const perdidos = filteredLeads.filter((l) => l.status === "perdido").length;
    const propostas = filteredLeads.filter((l) => l.status === "proposta").length;
    const faturado = filteredLeads.filter((l) => l.isPaid).reduce((acc, l) => acc + (l.paidValue || 0), 0);
    const estimado = filteredLeads.reduce((acc, l) => acc + l.value, 0);
    const taxaConversao = total > 0 ? Math.round((ganhos / total) * 100) : 0;
    const taxaResposta = total > 0 ? Math.round((respondidos / total) * 100) : 0;

    return { total, respondidos, agendados, pagos, ganhos, perdidos, propostas, faturado, estimado, taxaConversao, taxaResposta };
  }, [filteredLeads]);

  // Financial stats for filtered period
  const financialStats = useMemo(() => {
    const confirmed = filteredTransacoes.filter((t) => t.status === "confirmado");
    const receitas = confirmed.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + t.valor, 0);
    const despesas = confirmed.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + t.valor, 0);
    const lucro = receitas - despesas;
    const totalReceitas = confirmed.filter((t) => t.tipo === "receita").length;
    const totalDespesas = confirmed.filter((t) => t.tipo === "despesa").length;
    const ticketMedio = totalReceitas > 0 ? receitas / totalReceitas : 0;
    const pendentes = filteredTransacoes.filter((t) => t.status === "pendente").reduce((acc, t) => acc + t.valor, 0);

    return { receitas, despesas, lucro, totalReceitas, totalDespesas, ticketMedio, pendentes };
  }, [filteredTransacoes]);

  // Chart: Funnel data
  const funnelData = useMemo(() => {
    return leadsCtx.columns.map((col) => ({
      name: col.title,
      value: filteredLeads.filter((l) => l.status === col.id).length,
    }));
  }, [filteredLeads, leadsCtx.columns]);

  // Chart: Source distribution
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      counts[lead.source] = (counts[lead.source] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Chart: Financial by category
  const categoryData = useMemo(() => {
    const cats: Record<string, { receita: number; despesa: number }> = {};
    filteredTransacoes
      .filter((t) => t.status === "confirmado")
      .forEach((t) => {
        if (!cats[t.categoria]) cats[t.categoria] = { receita: 0, despesa: 0 };
        cats[t.categoria][t.tipo] += t.valor;
      });
    return Object.entries(cats).map(([name, vals]) => ({
      name: name.length > 18 ? name.slice(0, 18) + "…" : name,
      receita: vals.receita,
      despesa: vals.despesa,
    }));
  }, [filteredTransacoes]);

  const COLORS = ["#3B82F6", "#F97316", "#8B5CF6", "#EAB308", "#10B981", "#EF4444", "#EC4899", "#14B8A6"];

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Relatórios"
        subtitle="Análise completa de performance — Leads & Financeiro"
        icon={<BarChart3 className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Period & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-blue">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">Período</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setActivePeriod("custom"); }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setActivePeriod("custom"); }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["7dias", "30dias", "90dias", "mes"] as PeriodPreset[]).map((p) => (
                <Button
                  key={p}
                  variant={activePeriod === p ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => handlePeriodPreset(p)}
                >
                  {p === "7dias" ? "7 dias" : p === "30dias" ? "30 dias" : p === "90dias" ? "90 dias" : "Este mês"}
                </Button>
              ))}
            </div>
          </div>

          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-purple">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">Filtros de Leads</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Origem</label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="todos">Todas as origens</SelectItem>
                    {sourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {leadsCtx.columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} • {filteredTransacoes.length} transaç{filteredTransacoes.length !== 1 ? "ões" : "ão"}
            </div>
          </div>
        </div>

        {/* Lead KPIs - moved from LeadsCRM */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores de Leads</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard title="Total" value={leadStats.total.toString().padStart(2, "0")} icon={RefreshCw} iconColor="blue" variant="mini" />
          <StatCard title="Propostas" value={leadStats.propostas.toString()} icon={TestTube} iconColor="purple" variant="mini" />
          <StatCard title="Faturado (Leads)" value={`R$ ${leadStats.faturado.toLocaleString("pt-BR")}`} icon={DollarSign} iconColor="green" variant="mini" />
          <StatCard title="Perdidos" value={leadStats.perdidos.toString()} icon={AlertCircle} iconColor="red" variant="mini" />
          <StatCard title="Conversão" value={`${leadStats.taxaConversao}%`} icon={CheckCircle} iconColor="orange" variant="mini" />
          <StatCard title="Pagos" value={leadStats.pagos.toString()} icon={Award} iconColor="yellow" variant="mini" />
        </div>

        {/* Financial KPIs - synced with Financeiro */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores Financeiros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Receitas"
            value={`R$ ${financialStats.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={`${financialStats.totalReceitas} transações`}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatCard
            title="Despesas"
            value={`R$ ${financialStats.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={`${financialStats.totalDespesas} transações`}
            icon={TrendingDown}
            iconColor="red"
          />
          <StatCard
            title="Lucro Líquido"
            value={`R$ ${financialStats.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle={financialStats.receitas > 0 ? `Margem: ${Math.round((financialStats.lucro / financialStats.receitas) * 100)}%` : undefined}
            icon={Wallet}
            iconColor="blue"
            trend={financialStats.lucro !== 0 ? { value: Math.abs(Math.round((financialStats.lucro / (financialStats.receitas || 1)) * 100)), positive: financialStats.lucro > 0 } : undefined}
          />
          <StatCard
            title="Ticket Médio"
            value={`R$ ${financialStats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle="Por receita confirmada"
            icon={Target}
            iconColor="purple"
          />
        </div>

        {financialStats.pendentes > 0 && (
          <div className="card-metric mb-6 p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
              <span className="text-sm font-medium text-warning">
                R$ {financialStats.pendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em transações pendentes no período
              </span>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Funnel */}
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-purple"><BarChart3 className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">Funil de Conversão</h3>
                <p className="text-xs text-primary">Performance do pipeline</p>
              </div>
            </div>
            {filteredLeads.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </div>

          {/* Source Pie */}
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-yellow"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">Leads por Origem</h3>
                <p className="text-xs text-primary">Distribuição de canais</p>
              </div>
            </div>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Chart */}
        {categoryData.length > 0 && (
          <div className="card-metric mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-green"><DollarSign className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">Receitas vs Despesas por Categoria</h3>
                <p className="text-xs text-primary">Sincronizado com o módulo Financeiro</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Conversion Summary */}
        <div className="card-metric">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon stat-icon-teal"><TrendingDown className="w-5 h-5" /></div>
            <h3 className="font-semibold text-foreground">Resumo do Pipeline</h3>
          </div>
          {filteredLeads.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {leadsCtx.columns.map((col) => {
                const count = filteredLeads.filter((l) => l.status === col.id).length;
                const pct = leadStats.total > 0 ? Math.round((count / leadStats.total) * 100) : 0;
                return (
                  <div key={col.id} className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div
                      className="w-3 h-3 rounded-full mx-auto mb-2"
                      style={{
                        backgroundColor: col.color === "blue" ? "#3B82F6"
                          : col.color === "orange" ? "#F97316"
                          : col.color === "purple" ? "#8B5CF6"
                          : col.color === "yellow" ? "#EAB308"
                          : col.color === "green" ? "#10B981"
                          : col.color === "teal" ? "#14B8A6"
                          : "#EF4444"
                      }}
                    />
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{col.title}</p>
                    <p className="text-xs text-primary mt-1">{pct}%</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum lead encontrado no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
