import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { useLeads, columnConfig } from "@/contexts/LeadsContext";
import { useAgenda } from "@/contexts/AgendaContext";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const Index = () => {
  const { leads, stats: leadsStats } = useLeads();
  const { proximosAgendamentos, stats: agendaStats } = useAgenda();
  const { stats: financeiroStats } = useFinanceiro();
  const [loading, setLoading] = useState(true);

  // Simulating loading state for polished demo
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Trend data for charts
  const trendData = {
    lucro: [
      { value: 400 }, { value: 300 }, { value: 600 },
      { value: 800 }, { value: 500 }, { value: 900 }, { value: 1100 }
    ],
    faturamento: [
      { value: 2000 }, { value: 3500 }, { value: 3000 },
      { value: 4500 }, { value: 4000 }, { value: 5500 }, { value: 5000 }
    ]
  };

  // Recent leads (last 5, sorted by date)
  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        status: columnConfig.find((c) => c.id === lead.status)?.title || lead.status,
        time: formatDistanceToNow(new Date(lead.date), { addSuffix: true, locale: ptBR }),
      }));
  }, [leads]);

  // Format upcoming appointments for display
  const formattedAgendamentos = useMemo(() => {
    return proximosAgendamentos.slice(0, 4).map((ag) => {
      let dateLabel = format(ag.data, "dd/MM", { locale: ptBR });
      if (isToday(ag.data)) {
        dateLabel = `Hoje, ${ag.horario}`;
      } else if (isTomorrow(ag.data)) {
        dateLabel = `Amanhã, ${ag.horario}`;
      } else {
        dateLabel = `${format(ag.data, "dd/MM", { locale: ptBR })}, ${ag.horario}`;
      }

      return {
        id: ag.id,
        client: ag.clienteNome,
        type: ag.servico,
        date: dateLabel,
      };
    });
  }, [proximosAgendamentos]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Dashboard"
        subtitle="Visão geral da sua imobiliária"
        icon={<LayoutDashboard className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Featured Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatCard
            title="Comissões Previstas"
            value={formatCurrency(financeiroStats.lucro)}
            subtitle={`Margem: ${financeiroStats.faturamento > 0
              ? Math.round((financeiroStats.lucro / financeiroStats.faturamento) * 100)
              : 0}%`}
            icon={TrendingUp}
            variant="featured"
            iconColor="teal"
            trend={financeiroStats.lucro > 0 ? { value: 12, positive: true } : undefined}
            isLoading={loading}
            chartData={trendData.lucro}
          />
          <StatCard
            title="Faturamento"
            value={formatCurrency(financeiroStats.faturamento)}
            subtitle={`${financeiroStats.totalReceitas} transações este mês`}
            icon={DollarSign}
            variant="featured"
            iconColor="green"
            trend={financeiroStats.faturamento > 0 ? { value: 8, positive: true } : undefined}
            isLoading={loading}
            chartData={trendData.faturamento}
          />
          <div className="grid grid-cols-1 gap-4">
            <StatCard
              title="Conversão de Visitas"
              value={`${leadsStats.conversao}%`}
              icon={Target}
              iconColor="purple"
              trend={leadsStats.conversao > 0 ? { value: leadsStats.conversao, positive: true } : undefined}
              isLoading={loading}
            />
            <StatCard
              title="Ticket Médio"
              value={formatCurrency(financeiroStats.ticket)}
              icon={DollarSign}
              iconColor="pink"
              isLoading={loading}
            />
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Leads"
            value={leadsStats.total.toString()}
            icon={Users}
            iconColor="blue"
            isLoading={loading}
          />
          <StatCard
            title="Leads Ativos"
            value={(leadsStats.total - leadsStats.ganhos - leadsStats.perdidos).toString()}
            icon={Clock}
            iconColor="yellow"
            isLoading={loading}
          />
          <StatCard
            title="Fechados (Mês)"
            value={leadsStats.ganhos.toString()}
            icon={CheckCircle}
            iconColor="green"
            isLoading={loading}
          />
          <StatCard
            title="Visitas Agendadas"
            value={agendaStats.semana.toString()}
            subtitle="Esta semana"
            icon={Calendar}
            iconColor="orange"
            isLoading={loading}
          />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads Recentes */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground">Leads Recentes</h3>
              </div>
              <Link
                to="/leads"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                Ver todos
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-2">
              <div className="space-y-1">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead, idx) => (
                    <div
                      key={lead.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                        idx % 2 === 0 ? "bg-transparent" : "bg-secondary/20",
                        "hover:bg-primary/5 hover:translate-x-1"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-bold border border-primary/10 group-hover:border-primary/30">
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{lead.name}</p>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">{lead.status}</p>
                        </div>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground font-bold bg-secondary/50 px-2 py-1 rounded-md">
                        {lead.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Nenhum lead cadastrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Próximos Agendamentos */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground">Próximas Visitas</h3>
              </div>
              <Link
                to="/agenda"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                Ver todos
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-2">
              <div className="space-y-1">
                {formattedAgendamentos.length > 0 ? (
                  formattedAgendamentos.map((event, idx) => (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                        idx % 2 === 0 ? "bg-transparent" : "bg-secondary/20",
                        "hover:bg-primary/5 hover:translate-x-1"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:border-emerald-500/30">
                          <CheckCircle className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{event.client}</p>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">{event.type}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase">
                        {event.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Calendar className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Nenhum agendamento próximo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
