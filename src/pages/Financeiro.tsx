import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { useNotifications } from "@/contexts/NotificationsContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Target,
  Users,
  CreditCard,
  Filter,
  Download,
  Plus,
  Calendar,
  BarChart3,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useFinanceiro, Transacao, categoriasReceita, categoriasDespesa } from "@/contexts/FinanceiroContext";

export default function Financeiro() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { transacoes, setTransacoes } = useFinanceiro();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Date filters
  const [dataInicial, setDataInicial] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dataFinal, setDataFinal] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [transacaoToDelete, setTransacaoToDelete] = useState<Transacao | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: "receita" as "receita" | "despesa",
    descricao: "",
    valor: "",
    categoria: "",
    data: format(new Date(), "yyyy-MM-dd"),
    status: "confirmado" as "confirmado" | "pendente" | "cancelado",
    observacao: "",
  });

  // Quick date filters
  const setQuickPeriod = (days: number | "month") => {
    if (days === "month") {
      setDataInicial(format(startOfMonth(new Date()), "yyyy-MM-dd"));
      setDataFinal(format(endOfMonth(new Date()), "yyyy-MM-dd"));
    } else {
      setDataInicial(format(subDays(new Date(), days), "yyyy-MM-dd"));
      setDataFinal(format(new Date(), "yyyy-MM-dd"));
    }
  };

  // Filtered transactions
  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      const matchesSearch = searchTerm === "" ||
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = filterTipo === "todos" || t.tipo === filterTipo;
      const matchesStatus = filterStatus === "todos" || t.status === filterStatus;
      const matchesCategoria = filterCategoria === "todos" || t.categoria === filterCategoria;
      
      const transactionDate = parseISO(t.data);
      const startDate = parseISO(dataInicial);
      const endDate = parseISO(dataFinal);
      const matchesDate = isWithinInterval(transactionDate, { start: startDate, end: endDate });
      
      return matchesSearch && matchesTipo && matchesStatus && matchesCategoria && matchesDate;
    });
  }, [transacoes, searchTerm, filterTipo, filterStatus, filterCategoria, dataInicial, dataFinal]);

  // Stats calculations
  const stats = useMemo(() => {
    const confirmed = filteredTransacoes.filter(t => t.status === "confirmado");
    const faturamento = confirmed.filter(t => t.tipo === "receita").reduce((acc, t) => acc + t.valor, 0);
    const despesas = confirmed.filter(t => t.tipo === "despesa").reduce((acc, t) => acc + t.valor, 0);
    const lucro = faturamento - despesas;
    const saldo = faturamento - despesas;
    
    const totalPagamentos = confirmed.filter(t => t.tipo === "receita").length;
    const totalDespesas = confirmed.filter(t => t.tipo === "despesa").length;
    
    const ticket = totalPagamentos > 0 ? faturamento / totalPagamentos : 0;
    const cac = totalPagamentos > 0 ? despesas / totalPagamentos : 0;
    
    return { faturamento, despesas, lucro, saldo, ticket, cac, totalPagamentos, totalDespesas };
  }, [filteredTransacoes]);

  // Chart data
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTransactions = transacoes.filter(t => t.data === dateStr && t.status === "confirmado");
      
      const receitas = dayTransactions.filter(t => t.tipo === "receita").reduce((acc, t) => acc + t.valor, 0);
      const despesas = dayTransactions.filter(t => t.tipo === "despesa").reduce((acc, t) => acc + t.valor, 0);
      
      data.push({
        name: format(date, "dd/MM", { locale: ptBR }),
        receitas,
        despesas,
      });
    }
    
    return data;
  }, [transacoes]);

  // Top services
  const topServices = useMemo(() => {
    const confirmed = transacoes.filter(t => t.tipo === "receita" && t.status === "confirmado");
    const grouped = confirmed.reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transacoes]);

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      tipo: "receita",
      descricao: "",
      valor: "",
      categoria: "",
      data: format(new Date(), "yyyy-MM-dd"),
      status: "confirmado",
      observacao: "",
    });
    setEditingTransacao(null);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsModalOpen(open);
  };

  const handleSubmit = () => {
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const valorNumerico = parseFloat(formData.valor.replace(/[^\d,.-]/g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    if (editingTransacao) {
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === editingTransacao.id
            ? { ...formData, id: editingTransacao.id, valor: valorNumerico }
            : t
        )
      );
      toast({
        title: "Transação atualizada!",
        description: `${formData.descricao} foi atualizada.`,
      });
    } else {
      const novaTransacao: Transacao = {
        id: Date.now().toString(),
        ...formData,
        valor: valorNumerico,
      };
      setTransacoes((prev) => [...prev, novaTransacao]);
      toast({
        title: "Lançamento registrado!",
        description: `${formData.tipo === "receita" ? "Receita" : "Despesa"} de R$ ${valorNumerico.toFixed(2)} foi adicionada.`,
      });
      
      // Add notification
      addNotification({
        type: "financial",
        title: formData.tipo === "receita" ? "Nova Receita Registrada" : "Nova Despesa Registrada",
        message: `${formData.descricao}: R$ ${valorNumerico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        link: "/financeiro",
        metadata: { transacaoId: novaTransacao.id, valor: valorNumerico, tipo: formData.tipo },
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setFormData({
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      categoria: transacao.categoria,
      data: transacao.data,
      status: transacao.status,
      observacao: transacao.observacao || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transacao: Transacao) => {
    setTransacaoToDelete(transacao);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transacaoToDelete) {
      setTransacoes((prev) => prev.filter((t) => t.id !== transacaoToDelete.id));
      toast({
        title: "Transação removida",
        description: `${transacaoToDelete.descricao} foi excluída.`,
      });
      setTransacaoToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Status"].join(","),
      ...filteredTransacoes.map((t) =>
        [
          format(parseISO(t.data), "dd/MM/yyyy"),
          t.tipo === "receita" ? "Receita" : "Despesa",
          `"${t.descricao}"`,
          t.categoria,
          t.valor.toFixed(2),
          t.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmado":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pendente":
        return <Clock className="w-4 h-4 text-warning" />;
      case "cancelado":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const allCategories = [...new Set([...categoriasReceita, ...categoriasDespesa])];

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Dashboard Financeiro"
        subtitle="Visão completa do desempenho financeiro"
        icon={<DollarSign className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Actions */}
        <div className="flex justify-end gap-3 mb-6">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="btn-outline gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros Avançados</h4>
                
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setFilterTipo("todos");
                    setFilterStatus("todos");
                    setFilterCategoria("todos");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" className="btn-outline gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="btn-primary gap-2" onClick={handleAddNew}>
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </Button>
        </div>

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
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-outline text-xs"
                onClick={() => setQuickPeriod(7)}
              >
                Últimos 7 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-outline text-xs"
                onClick={() => setQuickPeriod(30)}
              >
                Últimos 30 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-outline text-xs"
                onClick={() => setQuickPeriod(90)}
              >
                Últimos 90 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="btn-outline text-xs"
                onClick={() => setQuickPeriod("month")}
              >
                Este mês
              </Button>
            </div>
          </div>

          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-purple">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">Buscar</h3>
            </div>
            <Input
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {filteredTransacoes.length} transação(ões) encontrada(s)
            </p>
          </div>
        </div>

        {/* Financial Stats - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Faturamento"
            value={formatCurrency(stats.faturamento)}
            subtitle="Receitas confirmadas"
            icon={DollarSign}
            iconColor="green"
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(stats.despesas)}
            subtitle="Gastos do período"
            icon={TrendingDown}
            iconColor="red"
          />
          <StatCard
            title="Lucro"
            value={formatCurrency(stats.lucro)}
            subtitle={stats.lucro >= 0 ? "Positivo" : "Negativo"}
            icon={TrendingUp}
            iconColor={stats.lucro >= 0 ? "orange" : "red"}
          />
          <StatCard
            title="Saldo"
            value={formatCurrency(stats.saldo)}
            subtitle="Disponível"
            icon={Wallet}
            iconColor="teal"
          />
        </div>

        {/* Financial Stats - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(stats.ticket)}
            subtitle="Por cliente"
            icon={Target}
            iconColor="blue"
          />
          <StatCard
            title="CAC"
            value={formatCurrency(stats.cac)}
            subtitle="Custo de Aquisição"
            icon={Users}
            iconColor="orange"
          />
          <StatCard
            title="Total Pagamentos"
            value={stats.totalPagamentos.toString()}
            subtitle="No período"
            icon={CreditCard}
            iconColor="purple"
          />
          <StatCard
            title="Total Despesas"
            value={stats.totalDespesas.toString()}
            subtitle="Lançamentos"
            icon={TrendingDown}
            iconColor="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-purple">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
                <p className="text-xs text-primary">Receitas vs Despesas (últimos 7 dias)</p>
              </div>
            </div>
            <div className="h-48">
              {chartData.some(d => d.receitas > 0 || d.despesas > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="stat-icon stat-icon-purple mx-auto mb-3">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registre transações para visualizar o fluxo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card-metric">
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon stat-icon-yellow">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Top Serviços</h3>
                <p className="text-xs text-primary">Mais vendidos</p>
              </div>
            </div>
            <div className="h-48">
              {topServices.length > 0 ? (
                <div className="space-y-3">
                  {topServices.map((service, index) => (
                    <div key={service.categoria} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-foreground">{service.categoria}</span>
                      </div>
                      <span className="text-sm font-medium text-success">
                        {formatCurrency(service.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="stat-icon stat-icon-yellow mx-auto mb-3">
                      <Target className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhum serviço encontrado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registre receitas para ver os serviços
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card-metric">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="stat-icon stat-icon-blue">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Transações Recentes</h3>
                <p className="text-xs text-muted-foreground">Lista de lançamentos do período</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredTransacoes.length > 0 ? (
              filteredTransacoes
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                .slice(0, 10)
                .map((transacao) => (
                  <div
                    key={transacao.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors",
                      transacao.status === "cancelado" && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        transacao.tipo === "receita" 
                          ? "bg-success/20 text-success" 
                          : "bg-destructive/20 text-destructive"
                      )}>
                        {transacao.tipo === "receita" ? (
                          <ArrowUpCircle className="w-5 h-5" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{transacao.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{transacao.categoria}</span>
                          <span>•</span>
                          <span>{format(parseISO(transacao.data), "dd/MM/yyyy")}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(transacao.status)}
                            {transacao.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-semibold",
                        transacao.tipo === "receita" ? "text-success" : "text-destructive"
                      )}>
                        {transacao.tipo === "receita" ? "+" : "-"} {formatCurrency(transacao.valor)}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(transacao)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(transacao)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <div className="stat-icon stat-icon-blue mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em "Novo Lançamento" para adicionar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo/Editar Transação */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTransacao ? (
                <>
                  <Pencil className="w-5 h-5 text-primary" />
                  Editar Lançamento
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary" />
                  Novo Lançamento
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingTransacao
                ? "Altere os dados do lançamento."
                : "Registre uma nova receita ou despesa."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.tipo === "receita" ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    formData.tipo === "receita" && "bg-success hover:bg-success/90"
                  )}
                  onClick={() => {
                    handleInputChange("tipo", "receita");
                    handleInputChange("categoria", "");
                  }}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.tipo === "despesa" ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    formData.tipo === "despesa" && "bg-destructive hover:bg-destructive/90"
                  )}
                  onClick={() => {
                    handleInputChange("tipo", "despesa");
                    handleInputChange("categoria", "");
                  }}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Consulta - Nome do cliente"
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => handleInputChange("valor", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange("data", e.target.value)}
                />
              </div>
            </div>

            {/* Categoria e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => handleInputChange("categoria", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.tipo === "receita" ? categoriasReceita : categoriasDespesa).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Informações adicionais..."
                value={formData.observacao}
                onChange={(e) => handleInputChange("observacao", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleModalClose(false)}>
              Cancelar
            </Button>
            <Button className="btn-primary" onClick={handleSubmit}>
              {editingTransacao ? "Salvar Alterações" : "Registrar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{transacaoToDelete?.descricao}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
