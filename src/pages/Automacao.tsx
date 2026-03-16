import { useState, useMemo, useEffect, useCallback } from "react";
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
  Webhook as WebhookIcon,
  Activity,
  CheckCircle,
  BarChart3,
  Plus,
  Settings,
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
  Loader2,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types
interface WebhookRow {
  id: string;
  nome: string;
  url: string;
  evento: string;
  descricao: string | null;
  ativo: boolean;
  secret_key: string;
  total_eventos: number;
  eventos_sucesso: number;
  ultima_execucao: string | null;
  created_at: string;
  updated_at: string;
}

interface EventoRow {
  id: string;
  webhook_id: string;
  webhook_nome: string;
  evento: string;
  payload: Record<string, unknown>;
  status: string;
  status_code: number | null;
  tempo_resposta: number | null;
  erro: string | null;
  created_at: string;
}

// Event types
const eventosDisponiveis = [
  { value: "lead_whatsapp", label: "Entrada de Lead WhatsApp", descricao: "Quando um novo lead entra via WhatsApp" },
  { value: "lead_status_alterado", label: "Atualização de Status via Chatbot", descricao: "Quando o status do lead é atualizado pelo chatbot" },
  { value: "lead_criado", label: "Lead Criado", descricao: "Quando um novo lead é cadastrado" },
  { value: "lead_convertido", label: "Lead Convertido", descricao: "Quando um lead fecha contrato" },
  { value: "visita_agendada", label: "Visita Agendada", descricao: "Quando uma visita a imóvel é marcada" },
  { value: "visita_realizada", label: "Visita Realizada", descricao: "Quando uma visita é concluída" },
  { value: "proposta_enviada", label: "Proposta Enviada", descricao: "Quando uma proposta é enviada ao proprietário" },
  { value: "corretor_adicionado", label: "Corretor Adicionado", descricao: "Quando um novo corretor é cadastrado" },
];

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "jscendxyylrjyrynkwmr";

export default function Automacao() {
  const { addNotification } = useNotifications();

  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRow | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<WebhookRow | null>(null);
  const [showUrl, setShowUrl] = useState<Record<string, boolean>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    url: "",
    evento: "",
    descricao: "",
    ativo: true,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [webhooksRes, eventosRes] = await Promise.all([
      (supabase as any).from("webhooks").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("webhook_eventos").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (webhooksRes.data) setWebhooks(webhooksRes.data as WebhookRow[]);
    if (eventosRes.data) setEventos(eventosRes.data as EventoRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    const eventosHoje = eventos.filter((e) => e.created_at.startsWith(hoje));
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

  const getEventoLabel = (value: string) => {
    return eventosDisponiveis.find((e) => e.value === value)?.label || value;
  };

  const getReceiverUrl = (webhookId: string) => {
    return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/webhook-receiver/${webhookId}`;
  };

  // New webhook
  const handleNewWebhook = () => {
    setSelectedWebhook(null);
    setFormData({ nome: "", url: "", evento: "", descricao: "", ativo: true });
    setIsModalOpen(true);
  };

  // Edit webhook
  const handleEditWebhook = (webhook: WebhookRow) => {
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
  const handleSaveWebhook = async () => {
    if (!formData.nome || !formData.url || !formData.evento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.url);
    } catch {
      toast.error("URL inválida. Insira uma URL válida do n8n.");
      return;
    }

    setSaving(true);

    if (selectedWebhook) {
      const { error } = await (supabase as any)
        .from("webhooks")
        .update({
          nome: formData.nome,
          url: formData.url,
          evento: formData.evento,
          descricao: formData.descricao || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWebhook.id);

      if (error) {
        toast.error("Erro ao atualizar webhook");
        setSaving(false);
        return;
      }
      toast.success("Webhook atualizado com sucesso!");
    } else {
      const { error } = await (supabase as any).from("webhooks").insert({
        nome: formData.nome,
        url: formData.url,
        evento: formData.evento,
        descricao: formData.descricao || null,
        ativo: formData.ativo,
      });

      if (error) {
        toast.error("Erro ao criar webhook");
        setSaving(false);
        return;
      }
      toast.success("Webhook criado com sucesso!");
      addNotification({
        type: "webhook",
        title: "Novo Webhook Configurado",
        message: `${formData.nome} foi criado e está ${formData.ativo ? "ativo" : "inativo"}`,
        link: "/automacao",
        metadata: { evento: formData.evento },
      });
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchData();
  };

  // Toggle active
  const handleToggleWebhook = async (webhook: WebhookRow) => {
    const { error } = await (supabase as any)
      .from("webhooks")
      .update({ ativo: !webhook.ativo, updated_at: new Date().toISOString() })
      .eq("id", webhook.id);

    if (error) {
      toast.error("Erro ao atualizar webhook");
      return;
    }
    toast.success(webhook.ativo ? "Webhook desativado" : "Webhook ativado");
    fetchData();
  };

  // Delete webhook
  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    const { error } = await (supabase as any).from("webhooks").delete().eq("id", webhookToDelete.id);
    if (error) {
      toast.error("Erro ao excluir webhook");
      return;
    }
    toast.success("Webhook excluído com sucesso!");
    setIsDeleteDialogOpen(false);
    setWebhookToDelete(null);
    fetchData();
  };

  // Test webhook - sends a real POST to the n8n URL
  const handleTestWebhook = async (webhook: WebhookRow) => {
    setTestingWebhook(webhook.id);
    const startTime = Date.now();

    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        webhook_nome: webhook.nome,
        evento: webhook.evento,
      };

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      });

      const tempoResposta = Date.now() - startTime;
      const isSuccess = response.ok;

      // Log event
      await (supabase as any).from("webhook_eventos").insert({
        webhook_id: webhook.id,
        webhook_nome: webhook.nome,
        evento: webhook.evento,
        payload: testPayload as unknown as Record<string, unknown>,
        status: isSuccess ? "sucesso" : "falha",
        status_code: response.status,
        tempo_resposta: tempoResposta,
        erro: isSuccess ? null : `HTTP ${response.status} - ${response.statusText}`,
      });

      // Update stats
      await (supabase as any)
        .from("webhooks")
        .update({
          total_eventos: webhook.total_eventos + 1,
          eventos_sucesso: isSuccess ? webhook.eventos_sucesso + 1 : webhook.eventos_sucesso,
          ultima_execucao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);

      if (isSuccess) {
        toast.success("Teste enviado com sucesso!", {
          description: `Resposta: ${response.status} em ${tempoResposta}ms`,
        });
      } else {
        toast.error("Falha no teste do webhook", {
          description: `HTTP ${response.status} - Verifique a URL`,
        });
      }
    } catch (err: unknown) {
      const tempoResposta = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

      await supabase.from("webhook_eventos").insert({
        webhook_id: webhook.id,
        webhook_nome: webhook.nome,
        evento: webhook.evento,
        payload: { test: true },
        status: "falha",
        status_code: 0,
        tempo_resposta: tempoResposta,
        erro: errorMessage,
      });

      toast.error("Falha no teste do webhook", {
        description: errorMessage.includes("timeout")
          ? "Timeout - o n8n não respondeu em 10s"
          : "Verifique a URL e tente novamente",
      });
    }

    setTestingWebhook(null);
    fetchData();
  };

  // View history
  const handleViewHistory = (webhook: WebhookRow) => {
    setSelectedWebhook(webhook);
    setIsHistoryModalOpen(true);
  };

  // Copy URL
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  // Toggle URL visibility
  const toggleUrlVisibility = (webhookId: string) => {
    setShowUrl((prev) => ({ ...prev, [webhookId]: !prev[webhookId] }));
  };

  // Format URL masked
  const formatUrl = (url: string, show: boolean) => {
    if (show) return url;
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}/webhook/****...`;
    } catch {
      return "****";
    }
  };

  // Webhook history
  const webhookHistory = selectedWebhook
    ? eventos.filter((e) => e.webhook_id === selectedWebhook.id)
    : [];

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header
          title="Automação n8n"
          subtitle="Configure webhooks para integração com n8n"
          icon={<Zap className="w-5 h-5" />}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Automação n8n"
        subtitle="Configure webhooks para integração com n8n"
        icon={<Zap className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Info Banner */}
        <div className="card-metric mb-6 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="stat-icon stat-icon-blue shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Como funciona a integração</h3>
              <p className="text-sm text-muted-foreground mb-2">
                1. Crie um webhook abaixo com a <strong>URL do n8n</strong> (para enviar dados ao n8n) ou use a <strong>URL de recebimento</strong> (para o n8n enviar dados para o CRM).
              </p>
              <p className="text-sm text-muted-foreground">
                2. No n8n, configure o nó <strong>Webhook</strong> com a URL de recebimento abaixo, ou use <strong>HTTP Request</strong> para enviar dados para a URL do n8n cadastrada.
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground">Gerencie seus webhooks de integração com n8n</p>
            </div>
          </div>
          <Button className="btn-primary gap-2" onClick={handleNewWebhook}>
            <Plus className="w-4 h-4" />
            Novo Webhook
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Webhooks" value={stats.totalWebhooks.toString()} icon={WebhookIcon} iconColor="blue" />
          <StatCard title="Hoje" value={stats.eventosHoje.toString()} icon={Activity} iconColor="yellow" />
          <StatCard title="Taxa Sucesso" value={`${stats.taxaSucesso}%`} icon={CheckCircle} iconColor="purple" />
          <StatCard title="Total Eventos" value={stats.totalEventos.toString()} icon={BarChart3} iconColor="green" />
        </div>

        {/* Webhooks List */}
        <div className="card-metric mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon stat-icon-green">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground">Webhooks Configurados</h3>
            <Badge variant="secondary" className="ml-2">{webhooks.length}</Badge>
          </div>

          {webhooks.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <div className="stat-icon stat-icon-blue mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Nenhum webhook configurado</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Configure webhooks para integrar o CRM com n8n
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

                      {/* n8n URL */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">n8n URL:</span>
                        <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                          {formatUrl(webhook.url, showUrl[webhook.id] || false)}
                        </code>
                        <button onClick={() => toggleUrlVisibility(webhook.id)} className="p-1 hover:bg-muted rounded">
                          {showUrl[webhook.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleCopyUrl(webhook.url)} className="p-1 hover:bg-muted rounded">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Receiver URL */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success">Receber:</span>
                        <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs truncate max-w-md">
                          {getReceiverUrl(webhook.id)}
                        </code>
                        <button onClick={() => handleCopyUrl(getReceiverUrl(webhook.id))} className="p-1 hover:bg-muted rounded">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {webhook.total_eventos} eventos
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {webhook.total_eventos > 0
                            ? Math.round((webhook.eventos_sucesso / webhook.total_eventos) * 100)
                            : 0}% sucesso
                        </span>
                        {webhook.ultima_execucao && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Última: {format(new Date(webhook.ultima_execucao), "dd/MM HH:mm", { locale: ptBR })}
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
                          <DropdownMenuItem onClick={() => window.open(webhook.url, "_blank")}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir URL n8n
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="stat-icon stat-icon-green">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">Eventos Recentes</h3>
              <Badge variant="secondary" className="ml-2">{eventos.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1">
              <RefreshCw className="w-3 h-3" />
              Atualizar
            </Button>
          </div>

          {eventos.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center">
              <Activity className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os eventos aparecerão aqui quando webhooks receberem dados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventos.slice(0, 15).map((evento) => (
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
                        {evento.webhook_nome}
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
                      {evento.status_code != null && evento.status_code > 0 && (
                        <Badge variant={evento.status === "sucesso" ? "default" : "destructive"} className="text-xs">
                          {evento.status_code}
                        </Badge>
                      )}
                      {evento.tempo_resposta != null && <span>{evento.tempo_resposta}ms</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(evento.created_at), "dd/MM HH:mm", { locale: ptBR })}
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
            <DialogTitle>{selectedWebhook ? "Editar Webhook" : "Novo Webhook"}</DialogTitle>
            <DialogDescription>
              Configure um webhook para integrar o CRM com o n8n
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Webhook *</Label>
              <Input
                id="nome"
                placeholder="Ex: Novo Lead - WhatsApp"
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
                Cole a URL de trigger/webhook do seu workflow n8n
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
            <Button onClick={handleSaveWebhook} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedWebhook ? "Salvar Alterações" : "Criar Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
            <DialogDescription>Eventos registrados para este webhook</DialogDescription>
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
                          {evento.status_code || "—"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {evento.tempo_resposta ?? "—"}ms
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(evento.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    {evento.erro && (
                      <p className="text-xs text-destructive mb-2">{evento.erro}</p>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
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
