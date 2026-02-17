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
} from "lucide-react";
import { useLeads, columnConfig, sourceOptions } from "@/contexts/LeadsContext";
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
  LineChart,
  Line,
  Legend,
} from "recharts";

// Period presets
type PeriodPreset = "7dias" | "30dias" | "90dias" | "mes" | "custom";

export default function Relatorios() {
  const { leads, stats } = useLeads();
  
  // Filter states
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [filterSource, setFilterSource] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>("30dias");

  // Period preset handlers
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

  // Filtered leads based on all filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Date filter
      const leadDate = parseISO(lead.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const matchesDate = isWithinInterval(leadDate, { start, end });

      // Source filter
      const matchesSource = filterSource === "todos" || lead.source === filterSource;

      // Status filter
      const matchesStatus = filterStatus === "todos" || lead.status === filterStatus;

      return matchesDate && matchesSource && matchesStatus;
    });
  }, [leads, startDate, endDate, filterSource, filterStatus]);

  // Calculated stats from filtered leads
  const filteredStats = useMemo(() => {
    const total = filteredLeads.length;
    const respondidos = filteredLeads.filter((l) => l.status !== "novo").length;
    const agendados = filteredLeads.filter((l) => 
      ["proposta", "negociacao", "ganho", "perdido"].includes(l.status)
    ).length;
    const atendidos = filteredLeads.filter((l) => 
      ["negociacao", "ganho", "perdido"].includes(l.status)
    ).length;
    const pagos = filteredLeads.filter((l) => l.isPaid).length;
    const ganhos = filteredLeads.filter((l) => l.status === "ganho").length;
    const perdidos = filteredLeads.filter((l) => l.status === "perdido").length;
    
    const faturamento = filteredLeads
      .filter((l) => l.isPaid)
      .reduce((acc, l) => acc + (l.paidValue || 0), 0);
    
    const ticketMedio = pagos > 0 ? faturamento / pagos : 0;
    
    // CAC placeholder (would need marketing costs data)
    const cac = 0;

    const taxaResposta = total > 0 ? Math.round((respondidos / total) * 100) : 0;
    const taxaAgendamento = respondidos > 0 ? Math.round((agendados / respondidos) * 100) : 0;
    const taxaAtendimento = agendados > 0 ? Math.round((atendidos / agendados) * 100) : 0;
    const taxaPagamento = atendidos > 0 ? Math.round((pagos / atendidos) * 100) : 0;
    const taxaConversao = total > 0 ? Math.round((ganhos / total) * 100) : 0;

    return {
      total,
      respondidos,
      agendados,
      atendidos,
      pagos,
      ganhos,
      perdidos,
      faturamento,
      ticketMedio,
      cac,
      taxaResposta,
      taxaAgendamento,
      taxaAtendimento,
      taxaPagamento,
      taxaConversao,
    };
  }, [filteredLeads]);

  // Chart data - Leads by status (funnel)
  const funnelData = useMemo(() => {
    return columnConfig.map((col) => ({
      name: col.title,
      value: filteredLeads.filter((l) => l.status === col.id).length,
      color: col.color,
    }));
  }, [filteredLeads]);

  // Chart data - Leads by source
  const sourceData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    });
    return Object.entries(sourceCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredLeads]);

  const COLORS = ["#3B82F6", "#F97316", "#8B5CF6", "#EAB308", "#10B981", "#EF4444", "#EC4899", "#14B8A6"];

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Relatórios"
        subtitle="Análise completa de performance"
        icon={<BarChart3 className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Period Filters */}
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
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePeriod("custom");
                  }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePeriod("custom");
                  }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={activePeriod === "7dias" ? "default" : "outline"} 
                size="sm" 
                className="text-xs"
                onClick={() => handlePeriodPreset("7dias")}
              >
                Últimos 7 dias
              </Button>
              <Button 
                variant={activePeriod === "30dias" ? "default" : "outline"} 
                size="sm" 
                className="text-xs"
                onClick={() => handlePeriodPreset("30dias")}
              >
                Últimos 30 dias
              </Button>
              <Button 
                variant={activePeriod === "90dias" ? "default" : "outline"} 
                size="sm" 
                className="text-xs"
                onClick={() => handlePeriodPreset("90dias")}
              >
                Últimos 90 dias
              </Button>
              <Button 
                variant={activePeriod === "mes" ? "default" : "outline"} 
                size="sm" 
                className="text-xs"
                onClick={() => handlePeriodPreset("mes")}
              >
                Este mês
              </Button>
            </div>
          </div>

          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-purple">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">Filtros</h3>
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
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
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
                    {columnConfig.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} encontrado{filteredLeads.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* KPIs Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Total de Leads"
            value={filteredStats.total.toString()}
            icon={Users}
            iconColor="blue"
          />
          <StatCard
            title="Responderam"
            value={filteredStats.respondidos.toString()}
            subtitle={`${filteredStats.taxaResposta}% do total`}
            icon={MessageCircle}
            iconColor="pink"
          />
          <StatCard
            title="Agendaram"
            value={filteredStats.agendados.toString()}
            subtitle={`${filteredStats.taxaAgendamento}% dos que responderam`}
            icon={Calendar}
            iconColor="orange"
          />
          <StatCard
            title="Atenderam"
            value={filteredStats.atendidos.toString()}
            subtitle={`${filteredStats.taxaAtendimento}% dos agendados`}
            icon={UserCheck}
            iconColor="teal"
          />
        </div>

        {/* KPIs Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Pagaram"
            value={filteredStats.pagos.toString()}
            subtitle={`${filteredStats.taxaPagamento}% dos que foram atendidos`}
            icon={CreditCard}
            iconColor="green"
          />
          <StatCard
            title="Faturamento"
            value={`R$ ${filteredStats.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            iconColor="green"
          />
          <StatCard
            title="Ticket Médio"
            value={`R$ ${filteredStats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle="Por cliente pagante"
            icon={TrendingUp}
            iconColor="blue"
          />
          <StatCard
            title="CAC"
            value={`R$ ${filteredStats.cac.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle="Custo de Aquisição"
            icon={AlertCircle}
            iconColor="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Funnel Chart */}
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-purple">
                <BarChart3 className="w-5 h-5" />
              </div>
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
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="stat-icon stat-icon-purple mx-auto mb-3">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste os filtros para ver os dados
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conversão</span>
                <span className="font-bold text-primary">{filteredStats.taxaConversao}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de Leads</span>
                <span className="font-bold text-foreground">{filteredStats.total}</span>
              </div>
            </div>
          </div>

          {/* Source Distribution */}
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-yellow">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Leads por Origem</h3>
                <p className="text-xs text-primary">Distribuição de canais</p>
              </div>
            </div>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="stat-icon stat-icon-yellow mx-auto mb-3">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste os filtros para ver os dados
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Summary */}
        <div className="card-metric">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon stat-icon-teal">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground">Resumo de Conversão</h3>
          </div>
          {filteredLeads.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {columnConfig.map((col) => {
                const count = filteredLeads.filter((l) => l.status === col.id).length;
                const percentage = filteredStats.total > 0 
                  ? Math.round((count / filteredStats.total) * 100) 
                  : 0;
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
                          : "#EF4444"
                      }}
                    />
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{col.title}</p>
                    <p className="text-xs text-primary mt-1">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="stat-icon stat-icon-teal mx-auto mb-3">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum lead encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajuste os filtros ou período para ver os dados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
