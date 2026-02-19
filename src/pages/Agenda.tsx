import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Users,
  Clock,
  User,
  Phone,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay, isSameMonth, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAgenda, Agendamento, statusOptions } from "@/contexts/AgendaContext";
import { useColaboradores } from "@/contexts/ColaboradoresContext";

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function Agenda() {
  const { agendamentos, isLoading, addAgendamento, updateAgendamento, deleteAgendamento, stats } = useAgenda();
  const { colaboradores } = useColaboradores();
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("semana");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [agendamentoToDelete, setAgendamentoToDelete] = useState<Agendamento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColaborador, setSelectedColaborador] = useState<string>("todos");

  // Form state
  const [formData, setFormData] = useState({
    clienteNome: "",
    clienteTelefone: "",
    colaboradorId: "",
    data: new Date(),
    horario: "",
    duracao: "60",
    servico: "",
    observacoes: "",
    status: "agendado",
  });

  // Calcular datas da semana
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekDaysLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  // Calcular dias do mês para visualização mensal
  const monthDates = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDayOfWeek = getDay(start);
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  }, [currentDate]);

  // Obter agendamentos para um dia específico
  const getAgendamentosForDay = (date: Date) => {
    return filteredAgendamentos.filter((ag) => isSameDay(ag.data, date));
  };

  // Navegação
  const goToPrevious = () => {
    if (viewMode === "semana") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === "mes") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const goToNext = () => {
    if (viewMode === "semana") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "mes") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtrar agendamentos
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((ag) => {
      const matchesSearch = searchTerm === "" ||
        ag.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.servico.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesColaborador = selectedColaborador === "todos" ||
        ag.colaboradorId === selectedColaborador;

      return matchesSearch && matchesColaborador;
    });
  }, [agendamentos, searchTerm, selectedColaborador]);

  // Obter agendamentos para um slot específico
  const getAgendamentosForSlot = (date: Date, time: string) => {
    return filteredAgendamentos.filter(
      (ag) => isSameDay(ag.data, date) && ag.horario.startsWith(time)
    );
  };

  // Handlers do formulário
  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.clienteNome || !formData.horario || !formData.colaboradorId) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (editingAgendamento) {
      await updateAgendamento(editingAgendamento.id, formData);
    } else {
      await addAgendamento(formData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clienteNome: "",
      clienteTelefone: "",
      colaboradorId: "",
      data: new Date(),
      horario: "",
      duracao: "60",
      servico: "",
      observacoes: "",
      status: "agendado",
    });
    setEditingAgendamento(null);
  };

  const handleCellClick = (date: Date, time: string) => {
    setEditingAgendamento(null);
    setFormData({
      clienteNome: "",
      clienteTelefone: "",
      colaboradorId: selectedColaborador !== "todos" ? selectedColaborador : "",
      data: date,
      horario: time,
      duracao: "60",
      servico: "",
      observacoes: "",
      status: "agendado",
    });
    setIsModalOpen(true);
  };

  const handleAgendamentoClick = (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgendamento(agendamento);
    setFormData({
      clienteNome: agendamento.clienteNome,
      clienteTelefone: agendamento.clienteTelefone,
      colaboradorId: agendamento.colaboradorId || "",
      data: agendamento.data,
      horario: agendamento.horario,
      duracao: agendamento.duracao,
      servico: agendamento.servico,
      observacoes: agendamento.observacoes,
      status: agendamento.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgendamentoToDelete(agendamento);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (agendamentoToDelete) {
      await deleteAgendamento(agendamentoToDelete.id);
      setAgendamentoToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsModalOpen(open);
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((s) => s.value === status);
    return option?.color || "bg-primary";
  };

  const getColaboradorNome = (id: string | null) => {
    if (!id) return "Não atribuído";
    return colaboradores.find((c) => c.id === id)?.nome || "Desconhecido";
  };

  // Renderizar header da data
  const renderDateHeader = () => {
    if (viewMode === "semana") {
      const startFormatted = format(weekDates[0], "dd/MM/yyyy", { locale: ptBR });
      const endFormatted = format(weekDates[6], "dd/MM/yyyy", { locale: ptBR });
      return `${startFormatted} - ${endFormatted}`;
    } else if (viewMode === "mes") {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else {
      return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  if (isLoading && agendamentos.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Visitas Agendadas" subtitle="Sincronizada com Supabase" icon={<Calendar className="w-5 h-5" />} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Visitas Agendadas"
        subtitle="Gerencie as visitas dos imóveis"
        icon={<Calendar className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Top Stats */}
        <div className="flex gap-4 mb-6">
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.hoje}</p>
            <p className="text-xs text-muted-foreground">Para Hoje</p>
          </div>
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.semana}</p>
            <p className="text-xs text-muted-foreground">Na Semana</p>
          </div>
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.agendados}</p>
            <p className="text-xs text-muted-foreground">Novos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-blue">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Corretor</h3>
                <p className="text-xs text-primary">{colaboradores.filter(c => c.status === 'ativo').length} ativos</p>
              </div>
            </div>
            <Select value={selectedColaborador} onValueChange={setSelectedColaborador}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Todos os colaboradores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os corretores</SelectItem>
                {colaboradores.filter(c => c.status === 'ativo').map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="card-metric">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon stat-icon-yellow">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-foreground">Busca</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do cliente ou serviço..."
                  className="pl-9 bg-secondary border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="card-metric p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{renderDateHeader()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "dia" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("dia")}
              >
                Dia
              </Button>
              <Button
                variant={viewMode === "semana" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("semana")}
              >
                Semana
              </Button>
              <Button
                variant={viewMode === "mes" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("mes")}
              >
                Mês
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card-metric overflow-hidden">
          {viewMode === "semana" ? (
            <>
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" /> Horário
                </div>
                {weekDates.map((date, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 text-center border-l border-border",
                      isSameDay(date, new Date()) && "bg-primary/10"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{weekDaysLabels[i]}</p>
                    <p className={cn("text-lg font-bold", isSameDay(date, new Date()) ? "text-primary" : "text-foreground")}>
                      {format(date, "dd")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-border/50">
                    <div className="p-3 text-sm text-muted-foreground text-center">{time}</div>
                    {weekDates.map((date, i) => {
                      const slotAgendamentos = getAgendamentosForSlot(date, time);
                      return (
                        <div
                          key={`${time}-${i}`}
                          className={cn(
                            "p-1 border-l border-border/50 min-h-[60px] hover:bg-secondary/30 cursor-pointer",
                            isSameDay(date, new Date()) && "bg-primary/5"
                          )}
                          onClick={() => handleCellClick(date, time)}
                        >
                          {slotAgendamentos.map((ag) => (
                            <div
                              key={ag.id}
                              className={cn("text-xs p-1 rounded mb-1 text-white group relative", getStatusColor(ag.status))}
                              onClick={(e) => handleAgendamentoClick(ag, e)}
                            >
                              <div className="font-medium truncate">{ag.clienteNome}</div>
                              <div className="opacity-80 truncate text-[10px]">{getColaboradorNome(ag.colaboradorId)}</div>
                              <button
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                                onClick={(e) => handleDeleteClick(ag, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : viewMode === "mes" ? (
            <div className="grid grid-cols-7 border-border">
              {/* Month view implementation similar to before but using Supabase data */}
              {weekDaysLabels.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border">{day}</div>
              ))}
              {monthDates.map((date, index) => {
                const dayAgendamentos = date ? getAgendamentosForDay(date) : [];
                return (
                  <div key={index} className={cn("min-h-[100px] p-2 border-b border-r border-border/50", date && "hover:bg-secondary/30 cursor-pointer", date && isSameDay(date, new Date()) && "bg-primary/10")} onClick={() => date && handleCellClick(date, "09:00")}>
                    {date && (
                      <>
                        <span className={cn("text-sm", isSameDay(date, new Date()) ? "text-primary font-bold" : "text-foreground")}>{format(date, "d")}</span>
                        <div className="mt-1 space-y-1">
                          {dayAgendamentos.slice(0, 2).map(ag => (
                            <div key={ag.id} className={cn("text-[10px] p-0.5 rounded text-white truncate", getStatusColor(ag.status))}>{ag.horario} {ag.clienteNome}</div>
                          ))}
                          {dayAgendamentos.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayAgendamentos.length - 2} mais</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {timeSlots.map((time) => {
                const items = getAgendamentosForSlot(currentDate, time);
                return (
                  <div key={time} className="flex border-b border-border/50 min-h-[80px]">
                    <div className="w-20 p-4 text-sm text-muted-foreground text-center border-r border-border">{time}</div>
                    <div className="flex-1 p-2 flex flex-wrap gap-2" onClick={() => handleCellClick(currentDate, time)}>
                      {items.map(ag => (
                        <div key={ag.id} className={cn("p-3 rounded-lg text-white min-w-[200px] relative group", getStatusColor(ag.status))} onClick={(e) => handleAgendamentoClick(ag, e)}>
                          <p className="font-bold">{ag.clienteNome}</p>
                          <p className="text-xs opacity-90">{ag.servico || "Serviço Geral"}</p>
                          <p className="text-xs mt-1 border-t border-white/20 pt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {getColaboradorNome(ag.colaboradorId)}</p>
                          <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteClick(ag, e)}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals are similar but with await on handlers */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAgendamento ? "Editar" : "Novo"} Agendamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input value={formData.clienteNome} onChange={(e) => handleInputChange("clienteNome", e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={formData.clienteTelefone} onChange={(e) => handleInputChange("clienteTelefone", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={formData.colaboradorId} onValueChange={(val) => handleInputChange("colaboradorId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.filter(c => c.status === 'ativo').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Horário *</Label>
                <Select value={formData.horario} onValueChange={(val) => handleInputChange("horario", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Serviço</Label>
                <Input value={formData.servico} onChange={(e) => handleInputChange("servico", e.target.value)} placeholder="Ex: Consulta de Rotina" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={(e) => handleInputChange("observacoes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleModalClose(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir agendamento?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
