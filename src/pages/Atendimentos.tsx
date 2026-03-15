import { useState, useMemo } from "react";
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
import { useAtendimentos, Atendimento } from "@/contexts/AtendimentosContext";
import { useLeads } from "@/contexts/LeadsContext";
import { ConversationList } from "@/components/atendimentos/ConversationList";
import { ChatPanel } from "@/components/atendimentos/ChatPanel";
import { AtendimentoDetailSheet } from "@/components/atendimentos/AtendimentoDetailSheet";
import { format } from "date-fns";
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

export default function Atendimentos() {
  const { atendimentos, addAtendimento, updateAtendimento, deleteAtendimento, addMensagem, stats } = useAtendimentos();
  const { leads } = useLeads();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const clientesDisponiveis = useMemo(() => leads.filter(l => l.status === "ganho"), [leads]);

  const filteredAtendimentos = useMemo(() => {
    return atendimentos.filter(atd => {
      const matchSearch =
        atd.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atd.assunto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "todos" || atd.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [atendimentos, searchTerm, statusFilter]);

  // Keep selected in sync with updated data
  const activeAtendimento = useMemo(() => {
    if (!selectedAtendimento) return filteredAtendimentos[0] || null;
    return atendimentos.find(a => a.id === selectedAtendimento.id) || filteredAtendimentos[0] || null;
  }, [selectedAtendimento, atendimentos, filteredAtendimentos]);

  const handleCriarAtendimento = () => {
    if (!novoAtendimento.clienteId || !novoAtendimento.assunto) {
      toast({ title: "Campos obrigatórios", description: "Selecione um cliente e informe o assunto", variant: "destructive" });
      return;
    }
    const cliente = clientesDisponiveis.find(c => c.id === novoAtendimento.clienteId);
    if (!cliente) return;

    const imovelSelecionado = imoveisInventario.find(i => i.id === novoAtendimento.imovelId);
    const tipoLabel = novoAtendimento.tipoSolicitacao
      ? ({ duvida_tecnica: "Dúvida Técnica", envio_documentos: "Envio de Documentos", proposta_compra: "Proposta de Compra", suporte_pos_venda: "Suporte Pós-Venda" }[novoAtendimento.tipoSolicitacao] || "")
      : "";

    const assuntoCompleto = `${tipoLabel ? `[${tipoLabel}] ` : ""}${novoAtendimento.assunto}${imovelSelecionado ? ` | Imóvel: ${imovelSelecionado.nome}` : ""}`;

    addAtendimento({
      clienteId: cliente.id,
      clienteNome: cliente.name,
      clienteEmail: cliente.email || null,
      clienteTelefone: cliente.phone || null,
      assunto: assuntoCompleto,
      status: "aberto",
      prioridade: novoAtendimento.prioridade,
      origem: novoAtendimento.origem,
      colaborador: "Equipe",
    });

    toast({ title: "Atendimento criado", description: `Novo atendimento para ${cliente.name}` });
    setDialogOpen(false);
    setNovoAtendimento({ clienteId: "", assunto: "", descricao: "", prioridade: "media", origem: "whatsapp", tipoSolicitacao: "", imovelId: "", docsRecebidos: [] });
  };

  const toggleDocRecebido = (docId: string) => {
    setNovoAtendimento(prev => ({
      ...prev,
      docsRecebidos: prev.docsRecebidos.includes(docId)
        ? prev.docsRecebidos.filter(d => d !== docId)
        : [...prev.docsRecebidos, docId],
    }));
  };

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
        subtitle="Conversas sincronizadas com WhatsApp via n8n"
        icon={<HeadphonesIcon className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Stats Bar */}
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

          {/* Action bar */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
            <Button size="sm" className="btn-primary gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Atendimento
            </Button>
          </div>
        </div>

        {/* WhatsApp Web Layout */}
        <div className="flex-1 mx-6 mb-4 rounded-xl border border-border overflow-hidden flex min-h-0">
          {/* Left: Conversation List */}
          <div className="w-[360px] shrink-0">
            <ConversationList
              atendimentos={filteredAtendimentos}
              selectedId={activeAtendimento?.id || null}
              onSelect={setSelectedAtendimento}
              onNewClick={() => setDialogOpen(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Right: Chat Panel */}
          <ChatPanel
            atendimento={activeAtendimento}
            onSendMessage={addMensagem}
            onUpdateStatus={updateAtendimento}
            onDelete={(id) => {
              deleteAtendimento(id);
              setSelectedAtendimento(null);
            }}
            onOpenDetails={() => setSheetOpen(true)}
          />
        </div>
      </div>

      {/* Detail Sheet */}
      <AtendimentoDetailSheet
        atendimento={activeAtendimento}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={updateAtendimento}
        onAddMensagem={addMensagem}
      />

      {/* New Atendimento Dialog */}
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
              <label className="text-sm text-muted-foreground mb-1 block">Cliente *</label>
              <Select value={novoAtendimento.clienteId} onValueChange={(v) => setNovoAtendimento({ ...novoAtendimento, clienteId: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientesDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum cliente disponível</SelectItem>
                  ) : (
                    clientesDisponiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tipo de Solicitação</label>
              <Select value={novoAtendimento.tipoSolicitacao} onValueChange={(v) => setNovoAtendimento({ ...novoAtendimento, tipoSolicitacao: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="duvida_tecnica"><span className="flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5" /> Dúvida Técnica</span></SelectItem>
                  <SelectItem value="envio_documentos"><span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Envio de Documentos</span></SelectItem>
                  <SelectItem value="proposta_compra"><span className="flex items-center gap-2"><Home className="w-3.5 h-3.5" /> Proposta de Compra</span></SelectItem>
                  <SelectItem value="suporte_pos_venda"><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Suporte Pós-Venda</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Vínculo com Imóvel</label>
              <Select value={novoAtendimento.imovelId} onValueChange={(v) => setNovoAtendimento({ ...novoAtendimento, imovelId: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione o imóvel (opcional)" /></SelectTrigger>
                <SelectContent>
                  {imoveisInventario.map((i) => <SelectItem key={i.id} value={i.id}><span className="flex items-center gap-2"><Home className="w-3.5 h-3.5 text-muted-foreground" />{i.nome}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Assunto *</label>
              <Input placeholder="Ex: Documentação para financiamento" value={novoAtendimento.assunto} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, assunto: e.target.value })} className="bg-secondary border-border" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
              <Textarea placeholder="Descreva o atendimento..." value={novoAtendimento.descricao} onChange={(e) => setNovoAtendimento({ ...novoAtendimento, descricao: e.target.value })} className="bg-secondary border-border" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Origem</label>
                <Select value={novoAtendimento.origem} onValueChange={(v) => setNovoAtendimento({ ...novoAtendimento, origem: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Prioridade</label>
                <Select value={novoAtendimento.prioridade} onValueChange={(v: "alta" | "media" | "baixa") => setNovoAtendimento({ ...novoAtendimento, prioridade: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Checklist de Documentos
              </label>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2.5 border border-border/50">
                {documentosChecklist.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2.5">
                    <Checkbox id={doc.id} checked={novoAtendimento.docsRecebidos.includes(doc.id)} onCheckedChange={() => toggleDocRecebido(doc.id)} />
                    <label htmlFor={doc.id} className={`text-sm cursor-pointer transition-colors ${novoAtendimento.docsRecebidos.includes(doc.id) ? "text-emerald-400 line-through" : "text-foreground"}`}>
                      {doc.label}
                    </label>
                    {novoAtendimento.docsRecebidos.includes(doc.id) && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground pt-1">{novoAtendimento.docsRecebidos.length}/{documentosChecklist.length} documentos recebidos</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriarAtendimento}>Criar Atendimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
