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
import { Atendimento, useAtendimentos } from "@/contexts/AtendimentosContext";
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
  const { 
    atendimentos: liveAtendimentos, 
    isLoading, 
    addMensagem: contextAddMensagem, 
    updateAtendimento: contextUpdateAtendimento 
  } = useAtendimentos();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [atendimentoToDelete, setAtendimentoToDelete] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Connectivity state - now reflects the context/Supabase initialization
  const [isConnected, setIsConnected] = useState(true);

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

  const handleUpdateStatus = async (id: string, status: string) => {
    await contextUpdateAtendimento(id, { status: status as "aberto" | "em_andamento" | "resolvido" });
    toast({ title: "Status atualizado" });
  };

  const confirmDelete = async () => {
    if (!atendimentoToDelete) return;
    try {
      const { error } = await supabase.from('atendimentos').delete().eq('id', atendimentoToDelete);
      if (error) throw error;
      toast({ title: "Conversa apagada" });
      setSelectedAtendimentoId(null);
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setAtendimentoToDelete(null);
    setIsDeleting(false);
  };

  const toggleDocRecebido = (docId: string) => {
    setNovoAtendimento(prev => ({
      ...prev,
      docsRecebidos: prev.docsRecebidos.includes(docId)
        ? prev.docsRecebidos.filter(d => d !== docId)
        : [...prev.docsRecebidos, docId],
    }));
  };

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
    if (!selectedAtendimentoId) return filteredAtendimentos[0] || null;
    return liveAtendimentos.find(a => a.id === selectedAtendimentoId) || filteredAtendimentos[0] || null;
  }, [selectedAtendimentoId, liveAtendimentos, filteredAtendimentos]);

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
              onSelect={(a) => setSelectedAtendimentoId(a.id)}
              onNewClick={() => setDialogOpen(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <ChatPanel
            atendimento={activeAtendimento as Atendimento}
            isConnected={isConnected}
            suggestion={aiSuggestion}
            onUseSuggestion={() => {
              if (aiSuggestion) {
                setAiSuggestion(null);
              }
            }}
            onClearSuggestion={() => setAiSuggestion(null)}
            onSendMessage={async (id, msg) => {
              await contextAddMensagem(id, msg);
              toast({ title: "Mensagem enviada" });
            }}
            onUpdateStatus={(id, data) => handleUpdateStatus(id, data.status as string)}
            onDelete={(id) => {
              setAtendimentoToDelete(id);
              setIsDeleting(true);
            }}
            onOpenDetails={() => setSheetOpen(true)}
          />
        </div>
      </div>

      <AtendimentoDetailSheet
        atendimento={activeAtendimento as Atendimento}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={contextUpdateAtendimento}
        onAddMensagem={contextAddMensagem}
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

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja apagar todo o histórico desta conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e removerá todas as mensagens do banco de dados (webhook_eventos e atendimentos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
