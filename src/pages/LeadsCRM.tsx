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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Search,
  Download,
  Plus,
  RefreshCw,
  DollarSign,
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
  Settings,
  Home,
  MapPin,
  FileText,
  Link,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useLeads, Lead, columnConfig, sourceOptions } from "@/contexts/LeadsContext";

const headerGradients = {
  blue: "bg-gradient-to-r from-blue-600 to-blue-500",
  orange: "bg-gradient-to-r from-orange-600 to-orange-500",
  purple: "bg-gradient-to-r from-purple-600 to-purple-500",
  yellow: "bg-gradient-to-r from-yellow-600 to-yellow-500",
  green: "bg-gradient-to-r from-emerald-600 to-emerald-500",
  red: "bg-gradient-to-r from-red-600 to-red-500",
};

// Source icon helper
function SourceIcon({ source, className }: { source: string; className?: string }) {
  if (source === "WhatsApp") return <MessageCircle className={cn("text-emerald-400", className)} />;
  if (source === "Instagram") return <Instagram className={cn("text-pink-400", className)} />;
  return null;
}

// Compact Draggable Lead Card
function DraggableLeadCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(lead.date), { addSuffix: false, locale: ptBR });
    } catch {
      return "";
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick(lead);
        }
      }}
      className={cn(
        "bg-card border border-border/50 rounded-lg p-3 cursor-grab active:cursor-grabbing touch-none",
        "hover:border-border transition-colors group",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-foreground text-sm truncate flex-1">{lead.name}</h4>
        <SourceIcon source={lead.source} className="w-4 h-4 ml-2 flex-shrink-0" />
      </div>

      {lead.phone && (
        <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
      )}

      {lead.email && (
        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        {lead.source && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {lead.source.toLowerCase()}
          </span>
        )}
        {timeAgo && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
}

// Drag Overlay Card
function LeadCardOverlay({ lead }: { lead: Lead }) {
  return (
    <div className="bg-card border border-primary rounded-lg p-3 shadow-2xl rotate-2 scale-105 w-[240px]">
      <h4 className="font-medium text-foreground text-sm truncate">{lead.name}</h4>
      {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
    </div>
  );
}

// Droppable Column
function DroppableColumn({
  column,
  leads,
  onCardClick,
  onAddLead,
}: {
  column: (typeof columnConfig)[0];
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  onAddLead: (status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[240px] w-[240px] flex-shrink-0 rounded-xl overflow-hidden bg-secondary/30 border border-border/30",
        isOver && "ring-2 ring-primary ring-dashed"
      )}
    >
      {/* Header */}
      <div className={cn("px-3 py-2.5", headerGradients[column.color])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-xs">{column.title}</h3>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">
              {leads.length}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => onAddLead(column.id)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-white/60 mt-0.5">{column.subtitle}</p>
      </div>

      {/* Cards area - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <DraggableLeadCard key={lead.id} lead={lead} onClick={onCardClick} />
          ))
        ) : (
          <button
            onClick={() => onAddLead(column.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-6 w-full justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar tarefa
          </button>
        )}
      </div>

      {/* Bottom add button */}
      {leads.length > 0 && (
        <button
          onClick={() => onAddLead(column.id)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-2 w-full justify-center border-t border-border/30"
        >
          <Plus className="w-3 h-3" />
          Adicionar tarefa
        </button>
      )}
    </div>
  );
}

// Lead Detail Sheet (popup with real estate niche fields)
function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onEdit,
  onMove,
  onConvert,
  onDelete,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  if (!lead) return null;

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const currentColumn = columnConfig.find((c) => c.id === lead.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/20 text-primary text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-lg">{lead.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] h-5">
                  {currentColumn?.title}
                </Badge>
                <SourceIcon source={lead.source} className="w-3.5 h-3.5" />
                <span className="text-xs">{lead.source}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* Contact Info */}
        <div className="py-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h4>
          {lead.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(new Date(lead.date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        </div>

        <Separator />

        {/* Real Estate Info */}
        <div className="py-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imóvel de Interesse</h4>
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="w-4 h-4 text-warning" />
            <span>Valor estimado: <span className="font-medium text-warning">R$ {lead.value.toLocaleString("pt-BR")}</span></span>
          </div>
          {lead.paidValue && lead.paidValue > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Valor pago: <span className="font-medium text-emerald-400">R$ {lead.paidValue.toLocaleString("pt-BR")}</span></span>
            </div>
          )}
          {lead.isPaid && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Pago</Badge>
          )}
        </div>

        <Separator />

        {/* AI Description / Notes */}
        <div className="py-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição / Resumo da IA</h4>
          {lead.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/50 rounded-lg p-3">
              {lead.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">Nenhuma descrição disponível. A IA preencherá automaticamente após interação.</p>
          )}
        </div>

        <Separator />

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <>
            <div className="py-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Actions */}
        <div className="py-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onOpenChange(false); onEdit(lead); }}>
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onOpenChange(false); onMove(lead); }}>
            <ArrowRight className="w-3.5 h-3.5" />
            Mover
          </Button>
          {lead.status !== "ganho" && (
            <Button variant="outline" size="sm" className="gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => { onOpenChange(false); onConvert(lead); }}>
              <UserCheck className="w-3.5 h-3.5" />
              Converter
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { onOpenChange(false); onDelete(lead); }}>
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function LeadsCRM() {
  const { addNotification } = useNotifications();
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLeadToStatus } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("todos");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Detail sheet
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      const matchesSource = filterSource === "todos" || lead.source === filterSource;
      return matchesSearch && matchesSource;
    });
  }, [leads, searchTerm, filterSource]);

  const getLeadsByStatus = (status: string) =>
    filteredLeads.filter((lead) => lead.status === status);

  // DnD
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

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

  // Card click -> open detail
  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  // Form handlers
  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", value: "", description: "", source: "", status: "novo" });
    setEditingLead(null);
  };

  const handleNewLead = (defaultStatus?: string) => {
    resetForm();
    if (defaultStatus) setFormData((prev) => ({ ...prev, status: defaultStatus }));
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
    const valorNumerico = parseFloat(formData.value.replace(/[^\d,.-]/g, "").replace(",", "."));

    if (editingLead) {
      await updateLead(editingLead.id, {
        name: formData.name, phone: formData.phone, email: formData.email,
        value: valorNumerico, description: formData.description,
        source: formData.source, status: formData.status,
      });
      toast.success("Lead atualizado!");
    } else {
      await addLead({
        name: formData.name, phone: formData.phone, email: formData.email,
        value: valorNumerico, description: formData.description,
        source: formData.source, status: formData.status,
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

  const handleMoveLead = async (lead: Lead, newStatus: string) => {
    await moveLeadToStatus(lead.id, newStatus);
    setIsMoveDialogOpen(false);
    setLeadToMove(null);
    setTargetStatus("");
  };

  const handleConvertLead = async () => {
    if (!leadToConvert) return;
    await updateLead(leadToConvert.id, { status: "ganho", isPaid: true, paidValue: leadToConvert.value });
    setIsConvertDialogOpen(false);
    setLeadToConvert(null);
  };

  const handleExport = () => {
    const headers = ["Nome", "Telefone", "Email", "Valor", "Status", "Origem", "Data"];
    const rows = filteredLeads.map((lead) => [
      lead.name, lead.phone, lead.email, `R$ ${lead.value.toFixed(2)}`,
      columnConfig.find((c) => c.id === lead.status)?.title || lead.status,
      lead.source, format(new Date(lead.date), "dd/MM/yyyy", { locale: ptBR }),
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

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        title="CRM de Leads"
        subtitle="Gerencie seus leads através do funil de vendas"
        icon={<Users className="w-5 h-5" />}
      />

      {/* Search bar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border/30">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-secondary border-border h-8 text-sm"
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas origens</SelectItem>
            {sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" />
          Exportar
        </Button>
        <Button size="sm" className="btn-primary gap-1.5 ml-auto h-8" onClick={() => handleNewLead()}>
          <Plus className="w-3.5 h-3.5" />
          Novo Lead
        </Button>
      </div>

      {/* Kanban - fills remaining space, horizontal scroll at bottom */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 p-4 h-full overflow-x-auto">
            {columnConfig.map((col) => (
              <DroppableColumn
                key={col.id}
                column={col}
                leads={getLeadsByStatus(col.id)}
                onCardClick={handleCardClick}
                onAddLead={(status) => handleNewLead(status)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditLead}
        onMove={(l) => { setLeadToMove(l); setIsMoveDialogOpen(true); }}
        onConvert={(l) => { setLeadToConvert(l); setIsConvertDialogOpen(true); }}
        onDelete={(l) => { setLeadToDelete(l); setIsDeleteDialogOpen(true); }}
      />

      {/* Create/Edit Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
            <DialogDescription>
              {editingLead ? "Atualize as informações do lead" : "Adicione um novo lead ao funil de vendas"}
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
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
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
              <Label>Observações</Label>
              <Textarea placeholder="Detalhes sobre o lead..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingLead ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
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

      {/* Convert Dialog */}
      <AlertDialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Converter para Cliente</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertLead} className="bg-emerald-600 hover:bg-emerald-700">Converter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
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
