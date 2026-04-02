import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeadphonesIcon,
  Plus,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  Home,
  ShieldCheck,
  HelpCircle,
  Paperclip,
  Download,
} from "lucide-react";
import { useLeads } from "@/contexts/LeadsContext";
import { ConversationList } from "@/components/atendimentos/ConversationList";
import { ChatPanel } from "@/components/atendimentos/ChatPanel";
import { AtendimentoDetailSheet } from "@/components/atendimentos/AtendimentoDetailSheet";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const documentosChecklist = [
  { id: "rg", label: "RG (Identidade)" },
  { id: "cpf", label: "CPF" },
  { id: "comprovante_renda", label: "Comprovante de Renda" },
  { id: "comprovante_residencia", label: "Comprovante de Residência" },
  { id: "certidao_casamento", label: "Certidão de Casamento / Nascimento" },
  { id: "extrato_fgts", label: "Extrato do FGTS" },
  { id: "declaracao_ir", label: "Declaração de IR" },
];

const imoveisInventario = [
  { id: "imovel-1", nome: "Apt. 302 - Ed. Solar das Palmeiras" },
  { id: "imovel-2", nome: "Casa 15 - Cond. Jardim Europa" },
  { id: "imovel-3", nome: "Sala 1001 - Centro Empresarial" },
  { id: "imovel-4", nome: "Cobertura - Ed. Vista Mar" },
  { id: "imovel-5", nome: "Terreno Lote 42 - Alphaville" },
];

type WebhookEvento = {
  id: string;
  phone?: string | null;
  sender_name?: string | null;
  message?: string | null;
  direction?: string | null;
  timestamp?: string | null;
  payload?: Record<string, unknown> | string | null;
  created_at?: string | null;
  evento?: string | null;
};

export default function Atendimentos() {
  const { leads } = useLeads();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [allWebhookEvents, setAllWebhookEvents] = useState<WebhookEvento[]>([]);
  const [novoAtendimento, setNovoAtendimento] = useState({
    clienteId: "",
    assunto: "",
    descricao: "",
    prioridade: "media" as "alta" | "media" | "baixa",
    origem: "whatsapp",
    tipoSolicitacao: "",
    imovelId: "",
    docsRecebidos: [] as string[],
  });

  const updateAtendimento = () => {};
  const addMensagem = async () => {};
  const toggleDocRecebido = (docId: string) => {
    setNovoAtendimento(prev => ({
      ...prev,
      docsRecebidos: prev.docsRecebidos.includes(docId)
        ? prev.docsRecebidos.filter(d => d !== docId)
        : [...prev.docsRecebidos, docId],
    }));
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('webhook_eventos')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(2000);

      if (error) {
        console.error("Erro ao buscar histórico:", error);
        return;
      }
      if (data) {
        setAllWebhookEvents(data as WebhookEvento[]);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-webhook-eventos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_eventos' },
        (realtimePayload) => {
          const newRow = realtimePayload.new as WebhookEvento;

          setAllWebhookEvents(prev => {
            if (prev.some(e => e.id === newRow.id)) return prev;
            return [...prev, newRow];
          });

          const dir = newRow.direction || "cliente";
          if (dir === 'cliente') {
            const nome = newRow.sender_name || 'Cliente';
            const msg = newRow.message || '...';
            setAiSuggestion(`Sugestão IA: Olá ${nome.split(' ')[0]}! Recebi sua mensagem: "${msg}". Como posso ajudar?`);
            toast({
              title: "Nova mensagem!",
              description: `${nome} enviou uma mensagem.`
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const parsePayload = (raw: unknown): Record<string, unknown> => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    if (typeof raw === 'object') return raw as Record<string, unknown>;
    return {};
  };

  const liveAtendimentos = useMemo(() => {
    const groups: Record<string, {
      id: string;
      clienteId: string | null;
      clienteNome: string;
      clienteTelefone: string;
      assunto: string;
      status: "aberto" | "em_andamento" | "resolvido";
      prioridade: "alta" | "media" | "baixa";
      origem: string;
      criadoEm: string;
      atualizadoEm: string;
      mensagens: Array<{ id: string; texto: string; remetente: string; timestamp: Date; imageUrl?: string }>;
    }> = {};

    const safeParseDate = (dateVal: unknown): Date => {
      if (!dateVal) return new Date();
      const d = new Date(dateVal as string);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const normalizePhone = (p: string) => p.replace(/\D/g, "");

    allWebhookEvents.forEach(evt => {
      const payload = parsePayload(evt.payload);

      const phone       = evt.phone      || (payload.phone as string)      || (payload.sender_phone as string) || (payload.from as string);
      const senderName  = evt.sender_name || (payload.sender_name as string) || (payload.pushName as string)   || (payload.contact_name as string) || (payload.name as string);
      const messageText = evt.message != null ? evt.message : ((payload.message ?? payload.text ?? payload.body ?? payload.content ?? "") as string);
      const direction   = evt.direction  || (payload.direction as string)  || "cliente";
      const imageUrl    = (payload.image_url ?? payload.imageUrl ?? payload.picture) as string | undefined;

      if (!phone || typeof phone !== 'string') return;
      if ((messageText === "" || messageText == null) && !imageUrl && direction !== "cliente") return;

      const normalized = normalizePhone(phone);

      if (!groups[normalized]) {
        const lead = leads.find(l => {
          const lp = l.phone ? normalizePhone(l.phone) : "";
          return lp === normalized || (lp && normalized.includes(lp)) || (normalized && lp.includes(normalized));
        });
        const fallbackName = lead ? lead.name : "Cliente WhatsApp";

        groups[normalized] = {
          id: phone,
          clienteId: lead?.id || null,
          clienteNome: senderName || fallbackName,
          clienteTelefone: phone,
          assunto: "Conversa WhatsApp",
          status: "aberto",
          prioridade: "media",
          origem: "whatsapp",
          criadoEm: evt.created_at || new Date().toISOString(),
          atualizadoEm: evt.created_at || new Date().toISOString(),
          mensagens: []
        };
      }

      if (senderName && groups[normalized].clienteNome === "Cliente WhatsApp") {
        groups[normalized].clienteNome = senderName;
      }

      groups[normalized].mensagens.push({
        id: evt.id,
        texto: messageText || "",
        remetente: direction === "cliente" ? "cliente" : "atendente",
        timestamp: safeParseDate(evt.created_at || new Date().toISOString()),
        imageUrl: imageUrl
      });
    });

    return Object.values(groups).sort((a, b) => {
      const lastA = a.mensagens[a.mensagens.length - 1]?.timestamp.getTime() || 0;
      const lastB = b.mensagens[b.mensagens.length - 1]?.timestamp.getTime() || 0;
      return lastB - lastA;
    });
  }, [allWebhookEvents, leads]);

  const filteredAtendimentos = useMemo(() => {
    return liveAtendimentos.filter(atd => {
      const matchSearch =
        (atd.clienteNome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (atd.clienteTelefone || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "todos" || atd.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [liveAtendimentos, searchTerm, statusFilter]);

  const activeAtendimento = useMemo(() => {
    if (!selectedPhone) return filteredAtendimentos[0] || null;
    return liveAtendimentos.find(a => a.id === selectedPhone) || filteredAtendimentos[0] || null;
  }, [selectedPhone, liveAtendimentos, filteredAtendimentos]);

  const stats = useMemo(() => {
    return {
      abertos: liveAtendimentos.filter(a => a.status === 'aberto').length,
      emAndamento: liveAtendimentos.filter(a => a.status === 'em_andamento').length,
      resolvidos: liveAtendimentos.filter(a => a.status === 'resolvido').length,
      tempoMedio: "15 min"
    };
  }, [liveAtendimentos]);

  const handleExportCSV = () => {
    const headers = ["Cliente", "Assunto", "Status", "Prioridade", "Origem", "Criado em"];
    const rows = filteredAtendimentos.map(atd => [
      atd.clienteNome, atd.assunto, atd.status, atd.prioridade, atd.origem, format(new Date(atd.criadoEm), "dd/MM/yyyy HH:mm"),
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `atendimentos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Central de Suporte"
        subtitle={
          <span className="flex items-center gap-1.5">
            Conversas sincronizadas com WhatsApp via Supabase Realtime
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
              title={isConnected ? "Conectado ao Supabase Realtime" : "Desconectado do Realtime"}
            />
          </span>
        }
        icon={<HeadphonesIcon className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 pt-4 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-metric flex items-center gap-3 py-3 px-4">
              <div className="stat-icon stat-icon-yellow w-9 h-9">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{stats.abertos}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Abertos</p>
              </div>
            </div>
            <div className="card-metric flex items-center gap-3 py-3 px-4">
              <div className="stat-icon stat-icon-blue w-9 h-9">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{stats.emAndamento}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Em Andamento</p>
              </div>
            </div>
            <div className="card-metric flex items-center gap-3 py-3 px-4">
              <div className="stat-icon stat-icon-green w-9 h-9">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{stats.resolvidos}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Resolvidos</p>
              </div>
            </div>
            <div className="card-metric flex items-center gap-3 py-3 px-4">
              <div className="stat-icon stat-icon-purple w-9 h-9">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{stats.tempoMedio}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tempo Médio</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
            <Button size="sm" className="btn-primary gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Atendimento
            </Button>
          </div>
        </div>

        <div className="flex-1 mx-6 mb-4 rounded-xl border border-border overflow-hidden flex min-h-0">
          <div className="w-[360px] shrink-0">
            <ConversationList
              atendimentos={filteredAtendimentos}
              selectedId={activeAtendimento?.id || null}
              onSelect={(a) => setSelectedPhone(a.id)}
              onNewClick={() => setDialogOpen(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <ChatPanel
            atendimento={activeAtendimento as any}
            isConnected={isConnected}
            suggestion={aiSuggestion}
            onUseSuggestion={() => {
              if (aiSuggestion) {
                setAiSuggestion(null);
              }
            }}
            onClearSuggestion={() => setAiSuggestion(null)}
            onSendMessage={async (id, msg) => {
              try {
                await fetch("https://n8n.autoia.store/webhook/dashboard-send-message", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phone: id,
                    message: msg.texto
                  })
                });
                toast({ title: "Mensagem enviada", description: "Aguardando sincronização..." });
              } catch (e) {
                console.error("Erro ao enviar para n8n", e);
                toast({ title: "Erro no envio", description: "Verifique a conexão.", variant: "destructive" });
              }
            }}
            onUpdateStatus={() => {}}
            onDelete={() => {}}
            onOpenDetails={() => setSheetOpen(true)}
          />
        </div>
      </div>

      <AtendimentoDetailSheet
        atendimento={activeAtendimento as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={updateAtendimento}
        onAddMensagem={addMensagem}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Novo Atendimento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Assunto *</label>
              <Input placeholder="Ex: Documentação para financiamento" value={novoAtendimento.assunto} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, assunto: e.target.value })} className="bg-secondary border-border" />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setDialogOpen(false)}>Criar Atendimento</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
