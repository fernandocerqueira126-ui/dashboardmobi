import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Download,
  Plus,
  RefreshCw,
  TestTube,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Award,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Instagram,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRight,
  UserCheck,
  TrendingUp,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useLeads, Lead, columnConfig, sourceOptions } from "@/contexts/LeadsContext";

const colorClasses = {
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

// Draggable Lead Card Component - drag pelo card inteiro
function DraggableLeadCard({
  lead,
  onEdit,
  onMove,
  onConvert,
  onDelete,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id,
    data: {
      type: "lead",
      lead,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "lead-card space-y-3 group cursor-grab active:cursor-grabbing touch-none",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="p-1 -ml-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{lead.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            {lead.source === "WhatsApp" && (
              <MessageCircle className="w-3.5 h-3.5 text-success fill-success/10" />
            )}
            {lead.source === "Instagram" && (
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(lead)}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Mover para...
            </DropdownMenuItem>
            {lead.status !== "ganho" && (
              <DropdownMenuItem onClick={() => onConvert(lead)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Converter para Cliente
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(lead)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="w-4 h-4" />
        <span>{lead.phone}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        <span className="truncate">{lead.email}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-warning" />
        <span className="text-warning font-medium">
          R$ {lead.value.toLocaleString("pt-BR")} estimado
        </span>
      </div>

      {lead.paidValue && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-success" />
          <span className="text-success font-medium">
            R$ {lead.paidValue.toLocaleString("pt-BR")} pago
          </span>
        </div>
      )}

      {lead.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {lead.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span>{format(new Date(lead.date), "dd/MM/yyyy", { locale: ptBR })}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {lead.isPaid && <span className="badge-status badge-paid">Pago</span>}
        <span className="badge-status bg-blue-500/20 text-blue-400 border-blue-500/30">
          {lead.source}
        </span>
      </div>
    </div>
  );
}

// Lead Card for Drag Overlay
function LeadCardOverlay({ lead }: { lead: Lead }) {
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="lead-card space-y-3 shadow-2xl ring-2 ring-primary rotate-3 scale-105">
      <div className="flex items-start gap-2">
        <div className="p-1 -ml-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{lead.name}</h4>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-warning" />
        <span className="text-warning font-medium">
          R$ {lead.value.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  leads,
  stats,
  onEdit,
  onMove,
  onConvert,
  onDelete,
}: {
  column: (typeof columnConfig)[0];
  leads: Lead[];
  stats: { estimated: number; invoiced: number; paid: number; conversion: number };
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-column flex flex-col h-full transition-all duration-200 min-w-[280px]",
        isOver && "ring-2 ring-primary ring-dashed bg-primary/5 scale-[1.02]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("w-2 h-2 rounded-full", colorClasses[column.color])} />
        <h3 className="font-medium text-foreground">{column.title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
          {leads.length}
        </span>
        {leads.length > 0 && (
          <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded ml-auto">
            ${leads.length}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-primary font-medium">
            R$ {stats.estimated.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-muted-foreground">Estimado</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-foreground font-medium">
            R$ {stats.invoiced.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-muted-foreground">Faturado</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-foreground font-medium">{stats.paid}</p>
          <p className="text-[10px] text-muted-foreground">Pagos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Conversão</span>
          <span className="text-foreground">{stats.conversion}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={cn("progress-fill", colorClasses[column.color])}
            style={{ width: `${Math.min(stats.conversion, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Meta: 25% conversão</p>
      </div>

      {/* Leads */}
      <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onMove={onMove}
              onConvert={onConvert}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-full">
            <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Vazio</p>
            <p className="text-xs text-center">Arraste leads para cá</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsCRM() {
  const { addNotification } = useNotifications();
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLeadToStatus, stats: globalStats } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("todos");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToMove, setLeadToMove] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    value: "",
    description: "",
    source: "",
    status: "novo",
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Stats recalculated from leads
  const stats = useMemo(() => {
    const total = leads.length;
    const pagos = leads.filter((l) => l.isPaid).length;
    const faturado = leads
      .filter((l) => l.isPaid)
      .reduce((acc, l) => acc + (l.paidValue || 0), 0);
    const estimado = leads.reduce((acc, l) => acc + l.value, 0);
    const ganhos = leads.filter((l) => l.status === "ganho").length;
    const conversao = total > 0 ? Math.round((ganhos / total) * 100) : 0;

    return { total, pagos, faturado, estimado, conversao, ganhos };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      const matchesSource =
        filterSource === "todos" || lead.source === filterSource;

      return matchesSearch && matchesSource;
    });
  }, [leads, searchTerm, filterSource]);

  // Get leads by status
  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  // Column stats
  const getColumnStats = (status: string) => {
    const columnLeads = getLeadsByStatus(status);
    const estimated = columnLeads.reduce((acc, l) => acc + l.value, 0);
    const invoiced = columnLeads
      .filter((l) => l.isPaid)
      .reduce((acc, l) => acc + (l.paidValue || 0), 0);
    const paid = columnLeads.filter((l) => l.isPaid).length;
    const conversion = leads.length > 0 ? Math.round((columnLeads.length / leads.length) * 100) : 0;

    return { estimated, invoiced, paid, conversion, count: columnLeads.length };
  };

  // Find which column a lead belongs to
  const findColumnForLead = (leadId: string): string | null => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.status || null;
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;
    const activeLead = leads.find((l) => l.id === activeLeadId);
    if (!activeLead) return;

    let targetColumn: string;
    if (columnConfig.some((col) => col.id === overId)) {
      targetColumn = overId;
    } else {
      const targetLead = leads.find((l) => l.id === overId);
      targetColumn = targetLead?.status || activeLead.status;
    }

    if (activeLead.status !== targetColumn) {
      await moveLeadToStatus(activeLeadId, targetColumn);
      const newColumn = columnConfig.find((c) => c.id === targetColumn)?.title;
      toast.success(`Lead movido para ${newColumn}`);

      if (targetColumn === "ganho") {
        addNotification({
          type: "success",
          title: "Lead Convertido! 🎉",
          message: `${activeLead.name} foi convertido para cliente.`,
          link: "/clientes",
        });
      }
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      value: "",
      description: "",
      source: "",
      status: "novo",
    });
    setEditingLead(null);
  };

  const handleNewLead = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      value: lead.value.toString(),
      description: lead.description || "",
      source: lead.source,
      status: lead.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.value || !formData.source) {
      toast.error("Preencha os campos obrigatórios (Nome, Telefone, Valor e Origem)");
      return;
    }

    const valorNumerico = parseFloat(
      formData.value.replace(/[^\d,.-]/g, "").replace(",", ".")
    );

    if (editingLead) {
      await updateLead(editingLead.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        value: valorNumerico,
        description: formData.description,
        source: formData.source,
        status: formData.status,
      });
      toast.success("Lead atualizado!");
    } else {
      await addLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        value: valorNumerico,
        description: formData.description,
        source: formData.source,
        status: formData.status,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      toast.success("Lead criado com sucesso!");
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    await deleteLead(leadToDelete.id);
    setIsDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  // Move lead via dialog
  const handleMoveLead = async (lead: Lead, newStatus: string) => {
    await moveLeadToStatus(lead.id, newStatus);
    setIsMoveDialogOpen(false);
    setLeadToMove(null);
    setTargetStatus("");
  };

  // Convert lead to client
  const handleConvertLead = async () => {
    if (!leadToConvert) return;
    await updateLead(leadToConvert.id, {
      status: "ganho",
      isPaid: true,
      paidValue: leadToConvert.value
    });
    setIsConvertDialogOpen(false);
    setLeadToConvert(null);
  };

  // Export leads
  const handleExport = () => {
    const headers = [
      "Nome",
      "Telefone",
      "Email",
      "Valor",
      "Status",
      "Origem",
      "Data",
    ];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.phone,
      lead.email,
      `R$ ${lead.value.toFixed(2)}`,
      columnConfig.find((c) => c.id === lead.status)?.title || lead.status,
      lead.source,
      format(new Date(lead.date), "dd/MM/yyyy", { locale: ptBR }),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Exportação concluída!");
  };

  // Get active lead for drag overlay
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="CRM de Leads"
        subtitle="Gerencie seus leads através do funil de vendas"
        icon={<Users className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-blue mx-auto mb-2">
              <RefreshCw className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {stats.total.toString().padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-purple mx-auto mb-2">
              <TestTube className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {getLeadsByStatus("proposta").length}
            </p>
            <p className="text-xs text-muted-foreground">Propostas</p>
          </div>
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-green mx-auto mb-2">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">
              R$ {stats.faturado.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">Faturado</p>
          </div>
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-red mx-auto mb-2">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {getLeadsByStatus("perdido").length}
            </p>
            <p className="text-xs text-muted-foreground">Perdidos</p>
          </div>
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-orange mx-auto mb-2">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{stats.conversao}%</p>
            <p className="text-xs text-muted-foreground">Conv</p>
          </div>
          <div className="card-metric p-3 text-center">
            <div className="stat-icon stat-icon-yellow mx-auto mb-2">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{stats.pagos}</p>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </div>
        </div>

        {/* Leads que Pagaram */}
        {stats.pagos > 0 && (
          <div className="card-metric mb-6 p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-success">
                {stats.pagos} Lead{stats.pagos > 1 ? "s" : ""} que Pagaram - Total: R$ {stats.faturado.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas origens</SelectItem>
              {sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="btn-primary gap-2 ml-auto" onClick={handleNewLead}>
            <Plus className="w-4 h-4" />
            Novo Lead
          </Button>
        </div>

        {/* Kanban Board with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columnConfig.map((col) => (
              <DroppableColumn
                key={col.id}
                column={col}
                leads={getLeadsByStatus(col.id)}
                stats={getColumnStats(col.id)}
                onEdit={handleEditLead}
                onMove={(l) => { setLeadToMove(l); setIsMoveDialogOpen(true); }}
                onConvert={(l) => { setLeadToConvert(l); setIsConvertDialogOpen(true); }}
                onDelete={(l) => { setLeadToDelete(l); setIsDeleteDialogOpen(true); }}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create/Edit Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
            <DialogDescription>
              {editingLead
                ? "Atualize as informações do lead"
                : "Adicione um novo lead ao funil de vendas"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email (Opcional)</Label>
              <Input type="email" placeholder="email@exemplo.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Estimado *</Label>
                <Input placeholder="R$ 0,00" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Origem *</Label>
                <Select value={formData.source} onValueChange={(val) => setFormData({ ...formData, source: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{columnConfig.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações / Descrição (Opcional)</Label>
              <Textarea placeholder="Detalhes extras sobre o lead..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingLead ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Mover Lead</DialogTitle></DialogHeader>
          <div className="py-4">
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger><SelectValue placeholder="Selecione o destino" /></SelectTrigger>
              <SelectContent>
                {columnConfig.filter((col) => col.id !== leadToMove?.status).map((col) => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => leadToMove && targetStatus && handleMoveLead(leadToMove, targetStatus)} disabled={!targetStatus}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Converter para Cliente</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertLead} className="bg-success">Converter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Lead</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

