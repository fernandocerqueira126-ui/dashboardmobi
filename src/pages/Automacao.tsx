import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { useNotifications } from "@/contexts/NotificationsContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Zap,
  Webhook,
  Activity,
  CheckCircle,
  BarChart3,
  Plus,
  Settings,
  Search,
  Layout,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Power,
  History,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subHours, subMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Types
interface Webhook {
  id: string;
  nome: string;
  url: string;
  evento: string;
  descricao?: string;
  ativo: boolean;
  criadoEm: string;
  ultimaExecucao?: string;
  totalEventos: number;
  eventosSuccesso: number;
}

interface EventoWebhook {
  id: string;
  webhookId: string;
  webhookNome: string;
  evento: string;
  payload: object;
  status: "sucesso" | "falha";
  statusCode?: number;
  tempoResposta?: number;
  dataHora: string;
  erro?: string;
}

// Event types for triggers
const eventosDisponiveis = [
  { value: "lead_criado", label: "Lead Criado", descricao: "Quando um novo lead é cadastrado" },
  { value: "lead_status_alterado", label: "Lead Movido de Status", descricao: "Quando um lead muda de coluna no Kanban" },
  { value: "lead_convertido", label: "Lead Convertido", descricao: "Quando um lead se torna cliente" },
  { value: "cliente_cadastrado", label: "Cliente Cadastrado", descricao: "Quando um novo cliente é cadastrado" },
  { value: "atendimento_agendado", label: "Atendimento Agendado", descricao: "Quando um atendimento é marcado" },
  { value: "atendimento_concluido", label: "Atendimento Concluído", descricao: "Quando um atendimento é finalizado" },
  { value: "transacao_criada", label: "Transação Financeira Criada", descricao: "Quando uma receita ou despesa é registrada" },
  { value: "colaborador_adicionado", label: "Colaborador Adicionado", descricao: "Quando um novo colaborador é cadastrado" },
];

// Tabs
const tabs = [
  { icon: Webhook, label: "Webhooks", active: true },
  { icon: Zap, label: "Workflows", badge: "Em Breve" },
  { icon: Layout, label: "Templates", badge: "Em Breve" },
  { icon: BarChart3, label: "Analytics", badge: "Em Breve" },
  { icon: Search, label: "Buscar", badge: "Em Breve" },
  { icon: FileText, label: "Dashboard" },
];

// Initial mock data
const initialWebhooks: Webhook[] = [
  {
    id: "1",
    nome: "Novo Lead - Notificação",
    url: "https://n8n.meudominio.com/webhook/abc123-lead-notify",
    evento: "lead_criado",
    descricao: "Envia notificação quando um novo lead entra no CRM",
    ativo: true,
    criadoEm: format(subDays(new Date(), 15), "yyyy-MM-dd"),
    ultimaExecucao: format(subHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss"),
    totalEventos: 45,
    eventosSuccesso: 43,
  },
  {
    id: "2",
    nome: "Lead Convertido - CRM",
    url: "https://n8n.meudominio.com/webhook/def456-lead-convert",
    evento: "lead_convertido",
    descricao: "Atualiza sistemas externos quando lead vira cliente",
    ativo: true,
    criadoEm: format(subDays(new Date(), 10), "yyyy-MM-dd"),
    ultimaExecucao: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
    totalEventos: 12,
    eventosSuccesso: 12,
  },
  {
    id: "3",
    nome: "Atendimento - Google Calendar",
    url: "https://n8n.meudominio.com/webhook/ghi789-calendar-sync",
    evento: "atendimento_agendado",
    descricao: "Sincroniza atendimentos com Google Calendar",
    ativo: false,
    criadoEm: format(subDays(new Date(), 5), "yyyy-MM-dd"),
    ultimaExecucao: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss"),
    totalEventos: 8,
    eventosSuccesso: 6,
  },
];

const initialEventos: EventoWebhook[] = [
  {
    id: "e1",
    webhookId: "1",
    webhookNome: "Novo Lead - Notificação",
    evento: "lead_criado",
    payload: { leadId: "123", nome: "João Silva", email: "joao@email.com" },
    status: "sucesso",
    statusCode: 200,
    tempoResposta: 245,
    dataHora: format(subMinutes(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss"),
  },
  {
    id: "e2",
    webhookId: "1",
    webhookNome: "Novo Lead - Notificação",
    evento: "lead_criado",
    payload: { leadId: "124", nome: "Maria Costa", email: "maria@email.com" },
    status: "sucesso",
    statusCode: 200,
    tempoResposta: 189,
    dataHora: format(subHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss"),
  },
  {
    id: "e3",
    webhookId: "2",
    webhookNome: "Lead Convertido - CRM",
    evento: "lead_convertido",
    payload: { leadId: "120", clienteId: "C45", valor: 2500 },
    status: "sucesso",
    statusCode: 200,
    tempoResposta: 312,
    dataHora: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
  },
  {
    id: "e4",
    webhookId: "3",
    webhookNome: "Atendimento - Google Calendar",
    evento: "atendimento_agendado",
    payload: { atendimentoId: "A88", data: "2024-01-20", hora: "14:00" },
    status: "falha",
    statusCode: 500,
    tempoResposta: 1520,
    dataHora: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss"),
    erro: "Timeout na conexão com Google Calendar API",
  },
  {
    id: "e5",
    webhookId: "1",
    webhookNome: "Novo Lead - Notificação",
    evento: "lead_criado",
    payload: { leadId: "125", nome: "Pedro Santos", email: "pedro@empresa.com" },
    status: "falha",
    statusCode: 503,
    tempoResposta: 5000,
    dataHora: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss"),
    erro: "Service Unavailable - n8n instance offline",
  },
];

export default function Automacao() {
  const { addNotification } = useNotifications();
  
  // State
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [eventos, setEventos] = useState<EventoWebhook[]>(initialEventos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);
  const [showUrl, setShowUrl] = useState<Record<string, boolean>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    url: "",
    evento: "",
    descricao: "",
    ativo: true,
  });

  // Stats
  const stats = useMemo(() => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    const eventosHoje = eventos.filter((e) => e.dataHora.startsWith(hoje));
    const totalEventos = eventos.length;
    const eventosSuccesso = eventos.filter((e) => e.status === "sucesso").length;
    const taxaSucesso = totalEventos > 0 ? Math.round((eventosSuccesso / totalEventos) * 100) : 0;

    return {
      totalWebhooks: webhooks.length,
      eventosHoje: eventosHoje.length,
      taxaSucesso,
      totalEventos,
    };
  }, [webhooks, eventos]);

  // Get event label
  const getEventoLabel = (value: string) => {
    const evento = eventosDisponiveis.find((e) => e.value === value);
    return evento?.label || value;
  };

  // Open modal for new webhook
  const handleNewWebhook = () => {
    setSelectedWebhook(null);
    setFormData({ nome: "", url: "", evento: "", descricao: "", ativo: true });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      nome: webhook.nome,
      url: webhook.url,
      evento: webhook.evento,
      descricao: webhook.descricao || "",
      ativo: webhook.ativo,
    });
    setIsModalOpen(true);
  };

  // Save webhook
  const handleSaveWebhook = () => {
    if (!formData.nome || !formData.url || !formData.evento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (selectedWebhook) {
      // Update existing
      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === selectedWebhook.id
            ? { ...w, ...formData }
            : w
        )
      );
      toast.success("Webhook atualizado com sucesso!");
    } else {
      // Create new
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        nome: formData.nome,
        url: formData.url,
        evento: formData.evento,
        descricao: formData.descricao,
        ativo: formData.ativo,
        criadoEm: format(new Date(), "yyyy-MM-dd"),
        totalEventos: 0,
        eventosSuccesso: 0,
      };
      setWebhooks((prev) => [...prev, newWebhook]);
      toast.success("Webhook criado com sucesso!");
      
      // Add notification for new webhook
      addNotification({
        type: "webhook",
        title: "Novo Webhook Configurado",
        message: `${formData.nome} foi criado e está ${formData.ativo ? "ativo" : "inativo"}`,
        link: "/automacao",
        metadata: { webhookId: newWebhook.id, evento: formData.evento },
      });
    }
    setIsModalOpen(false);
  };

  // Toggle webhook active status
  const handleToggleWebhook = (webhook: Webhook) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === webhook.id ? { ...w, ativo: !w.ativo } : w
      )
    );
    toast.success(webhook.ativo ? "Webhook desativado" : "Webhook ativado");
  };

  // Delete webhook
  const handleDeleteWebhook = () => {
    if (!webhookToDelete) return;
    setWebhooks((prev) => prev.filter((w) => w.id !== webhookToDelete.id));
    setEventos((prev) => prev.filter((e) => e.webhookId !== webhookToDelete.id));
    toast.success("Webhook excluído com sucesso!");
    setIsDeleteDialogOpen(false);
    setWebhookToDelete(null);
  };

  // Test webhook
  const handleTestWebhook = async (webhook: Webhook) => {
    setTestingWebhook(webhook.id);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const isSuccess = Math.random() > 0.2; // 80% success rate for demo
    
    const newEvento: EventoWebhook = {
      id: `test-${Date.now()}`,
      webhookId: webhook.id,
      webhookNome: webhook.nome,
      evento: webhook.evento,
      payload: { test: true, timestamp: new Date().toISOString() },
      status: isSuccess ? "sucesso" : "falha",
      statusCode: isSuccess ? 200 : 500,
      tempoResposta: Math.floor(Math.random() * 500) + 100,
      dataHora: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      erro: isSuccess ? undefined : "Teste falhou - verifique a URL do webhook",
    };

    setEventos((prev) => [newEvento, ...prev]);
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === webhook.id
          ? {
              ...w,
              totalEventos: w.totalEventos + 1,
              eventosSuccesso: isSuccess ? w.eventosSuccesso + 1 : w.eventosSuccesso,
              ultimaExecucao: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
            }
          : w
      )
    );

    if (isSuccess) {
      toast.success("Teste enviado com sucesso!", {
        description: `Resposta: 200 OK em ${newEvento.tempoResposta}ms`,
      });
      addNotification({
        type: "webhook",
        title: "Webhook Executado",
        message: `${webhook.nome} disparou com sucesso (200 OK)`,
        link: "/automacao",
        metadata: { webhookId: webhook.id, status: "sucesso", statusCode: 200 },
      });
    } else {
      toast.error("Falha no teste do webhook", {
        description: "Verifique a URL e tente novamente",
      });
      addNotification({
        type: "webhook",
        title: "Falha no Webhook",
        message: `${webhook.nome} falhou (${newEvento.statusCode})`,
        link: "/automacao",
        metadata: { webhookId: webhook.id, status: "falha", statusCode: newEvento.statusCode },
      });
    }

    setTestingWebhook(null);
  };

  // View history for a webhook
  const handleViewHistory = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsHistoryModalOpen(true);
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  // Toggle URL visibility
  const toggleUrlVisibility = (webhookId: string) => {
    setShowUrl((prev) => ({ ...prev, [webhookId]: !prev[webhookId] }));
  };

  // Format URL for display (masked)
  const formatUrl = (url: string, show: boolean) => {
    if (show) return url;
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}/webhook/****...`;
  };

  // Get webhook history
  const webhookHistory = selectedWebhook
    ? eventos.filter((e) => e.webhookId === selectedWebhook.id)
    : [];

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Automação n8n"
        subtitle="Configure webhooks para enviar eventos do CRM para n8n"
        icon={<Zap className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Tabs */}
        <div className="card-metric mb-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  tab.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="bg-secondary text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="stat-icon stat-icon-blue">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Configurações de Webhook</h2>
              <p className="text-sm text-muted-foreground">Configure webhooks para enviar eventos do CRM para n8n</p>
            </div>
          </div>
          <Button className="btn-primary gap-2" onClick={handleNewWebhook}>
            <Plus className="w-4 h-4" />
            Novo Webhook
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Webhooks"
            value={stats.totalWebhooks.toString()}
            icon={Webhook}
            iconColor="blue"
          />
          <StatCard
            title="Hoje"
            value={stats.eventosHoje.toString()}
            icon={Activity}
            iconColor="yellow"
          />
          <StatCard
            title="Taxa Sucesso"
            value={`${stats.taxaSucesso}%`}
            icon={CheckCircle}
            iconColor="purple"
          />
          <StatCard
            title="Total Eventos"
            value={stats.totalEventos.toString()}
            icon={BarChart3}
            iconColor="green"
          />
        </div>

        {/* Webhooks List */}
        <div className="card-metric mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon stat-icon-green">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground">Webhooks Configurados</h3>
            <Badge variant="secondary" className="ml-2">
              {webhooks.length}
            </Badge>
          </div>

          {webhooks.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <div className="stat-icon stat-icon-blue mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Nenhum webhook configurado</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Configure webhooks para enviar eventos do CRM para n8n automaticamente
              </p>
              <Button className="btn-primary gap-2" onClick={handleNewWebhook}>
                <Plus className="w-4 h-4" />
                Configurar Primeiro Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    webhook.ativo
                      ? "bg-secondary/30 border-border"
                      : "bg-muted/50 border-muted opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{webhook.nome}</h4>
                        <Badge variant={webhook.ativo ? "default" : "secondary"}>
                          {webhook.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{getEventoLabel(webhook.evento)}</Badge>
                      </div>
                      {webhook.descricao && (
                        <p className="text-sm text-muted-foreground mb-2">{webhook.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                            {formatUrl(webhook.url, showUrl[webhook.id] || false)}
                          </code>
                          <button
                            onClick={() => toggleUrlVisibility(webhook.id)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {showUrl[webhook.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyUrl(webhook.url)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {webhook.totalEventos} eventos
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {webhook.totalEventos > 0
                            ? Math.round((webhook.eventosSuccesso / webhook.totalEventos) * 100)
                            : 0}
                          % sucesso
                        </span>
                        {webhook.ultimaExecucao && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Última: {format(new Date(webhook.ultimaExecucao), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={!webhook.ativo || testingWebhook === webhook.id}
                        className="gap-1"
                      >
                        {testingWebhook === webhook.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Testar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditWebhook(webhook)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewHistory(webhook)}>
                            <History className="w-4 h-4 mr-2" />
                            Ver Histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleWebhook(webhook)}>
                            <Power className="w-4 h-4 mr-2" />
                            {webhook.ativo ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(webhook.url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setWebhookToDelete(webhook);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="card-metric">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon stat-icon-green">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground">Eventos Recentes</h3>
            <Badge variant="secondary" className="ml-2">
              {eventos.length}
            </Badge>
          </div>

          {eventos.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum evento disparado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os eventos aparecerão aqui quando webhooks forem disparados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventos.slice(0, 10).map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  {evento.status === "sucesso" ? (
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {evento.webhookNome}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getEventoLabel(evento.evento)}
                      </Badge>
                    </div>
                    {evento.erro && (
                      <p className="text-xs text-destructive mt-0.5 truncate">{evento.erro}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {evento.statusCode && (
                        <Badge
                          variant={evento.status === "sucesso" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {evento.statusCode}
                        </Badge>
                      )}
                      {evento.tempoResposta && (
                        <span>{evento.tempoResposta}ms</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(evento.dataHora), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Webhook Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedWebhook ? "Editar Webhook" : "Novo Webhook"}
            </DialogTitle>
            <DialogDescription>
              Configure um webhook para enviar eventos do CRM para o n8n
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Webhook *</Label>
              <Input
                id="nome"
                placeholder="Ex: Novo Lead - Notificação"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook n8n *</Label>
              <Input
                id="url"
                placeholder="https://n8n.seudominio.com/webhook/..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Cole aqui a URL de trigger do seu workflow n8n
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evento">Evento Gatilho *</Label>
              <Select
                value={formData.evento}
                onValueChange={(value) => setFormData({ ...formData, evento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventosDisponiveis.map((evento) => (
                    <SelectItem key={evento.value} value={evento.value}>
                      <div className="flex flex-col">
                        <span>{evento.label}</span>
                        <span className="text-xs text-muted-foreground">{evento.descricao}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o que esse webhook faz..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Webhook ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWebhook}>
              {selectedWebhook ? "Salvar Alterações" : "Criar Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o webhook "{webhookToDelete?.nome}"? 
              Esta ação não pode ser desfeita e todos os eventos relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico: {selectedWebhook?.nome}
            </DialogTitle>
            <DialogDescription>
              Todos os eventos disparados para este webhook
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            {webhookHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>Nenhum evento registrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {webhookHistory.map((evento) => (
                  <div
                    key={evento.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      evento.status === "sucesso"
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-destructive/10 border-destructive/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {evento.status === "sucesso" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <Badge variant={evento.status === "sucesso" ? "default" : "destructive"}>
                          {evento.statusCode}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {evento.tempoResposta}ms
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(evento.dataHora), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {evento.erro && (
                      <p className="text-sm text-destructive mb-2">{evento.erro}</p>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(evento.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
