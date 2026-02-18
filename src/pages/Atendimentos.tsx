import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HeadphonesIcon,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Download,
  FileText,
  Home,
  ShieldCheck,
  HelpCircle,
  Send as SendIcon,
  Paperclip,
} from "lucide-react";
import { useAtendimentos, Atendimento } from "@/contexts/AtendimentosContext";
import { useLeads } from "@/contexts/LeadsContext";
import { AtendimentoDetailSheet } from "@/components/atendimentos/AtendimentoDetailSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusConfig = {
  aberto: { label: "Aberto", color: "bg-yellow-500/20 text-yellow-400" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400" },
  resolvido: { label: "Resolvido", color: "bg-green-500/20 text-green-400" },
};

const prioridadeConfig = {
  alta: { label: "Alta", color: "text-red-400" },
  media: { label: "Média", color: "text-yellow-400" },
  baixa: { label: "Baixa", color: "text-green-400" },
};

const origemConfig: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "bg-green-500/20 text-green-400" },
  email: { label: "E-mail", color: "bg-blue-500/20 text-blue-400" },
  telefone: { label: "Telefone", color: "bg-purple-500/20 text-purple-400" },
  presencial: { label: "Presencial", color: "bg-orange-500/20 text-orange-400" },
  crm: { label: "CRM", color: "bg-primary/20 text-primary" },
};

const tipoSolicitacaoConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  duvida_tecnica: { label: "Dúvida Técnica", icon: <HelpCircle className="w-3.5 h-3.5" /> },
  envio_documentos: { label: "Envio de Documentos", icon: <FileText className="w-3.5 h-3.5" /> },
  proposta_compra: { label: "Proposta de Compra", icon: <Home className="w-3.5 h-3.5" /> },
  suporte_pos_venda: { label: "Suporte Pós-Venda", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
};

const documentosChecklist = [
  { id: "rg", label: "RG (Identidade)" },
  { id: "cpf", label: "CPF" },
  { id: "comprovante_renda", label: "Comprovante de Renda" },
  { id: "comprovante_residencia", label: "Comprovante de Residência" },
  { id: "certidao_casamento", label: "Certidão de Casamento / Nascimento" },
  { id: "extrato_fgts", label: "Extrato do FGTS" },
  { id: "declaracao_ir", label: "Declaração de IR" },
];

// Imóveis simulados (inventário)
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
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state para novo atendimento
  const [novoAtendimento, setNovoAtendimento] = useState({
    clienteId: "",
    assunto: "",
    descricao: "",
    prioridade: "media" as "alta" | "media" | "baixa",
    origem: "whatsapp" as string,
    tipoSolicitacao: "" as string,
    imovelId: "" as string,
    docsRecebidos: [] as string[],
  });

  // Clientes disponíveis (leads ganhos)
  const clientesDisponiveis = useMemo(() => {
    return leads.filter(lead => lead.status === "ganho");
  }, [leads]);

  // Filtrar atendimentos
  const filteredAtendimentos = useMemo(() => {
    return atendimentos.filter(atd => {
      const matchesSearch =
        atd.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atd.assunto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || atd.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [atendimentos, searchTerm, statusFilter]);

  const handleCriarAtendimento = () => {
    if (!novoAtendimento.clienteId || !novoAtendimento.assunto) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um cliente e informe o assunto",
        variant: "destructive",
      });
      return;
    }

    const cliente = clientesDisponiveis.find(c => c.id === novoAtendimento.clienteId);
    if (!cliente) return;

    const imovelSelecionado = imoveisInventario.find(i => i.id === novoAtendimento.imovelId);
    const tipoLabel = novoAtendimento.tipoSolicitacao
      ? tipoSolicitacaoConfig[novoAtendimento.tipoSolicitacao]?.label
      : "";
    const docsInfo = novoAtendimento.docsRecebidos.length > 0
      ? `\nDocs recebidos: ${novoAtendimento.docsRecebidos.map(d => documentosChecklist.find(dc => dc.id === d)?.label).join(", ")}`
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

    // Se houver descrição ou docs, adicionar como primeira mensagem
    if (novoAtendimento.descricao || docsInfo) {
      // Will be added after atendimento is created via realtime
    }

    toast({
      title: "Atendimento criado",
      description: `Novo atendimento para ${cliente.name}`,
    });

    setDialogOpen(false);
    setNovoAtendimento({
      clienteId: "",
      assunto: "",
      descricao: "",
      prioridade: "media",
      origem: "whatsapp",
      tipoSolicitacao: "",
      imovelId: "",
      docsRecebidos: [],
    });
  };

  const handleExportCSV = () => {
    const headers = ["Cliente", "Assunto", "Status", "Prioridade", "Origem", "Criado em"];
    const rows = filteredAtendimentos.map(atd => [
      atd.clienteNome,
      atd.assunto,
      statusConfig[atd.status].label,
      prioridadeConfig[atd.prioridade].label,
      origemConfig[atd.origem]?.label || atd.origem,
      format(new Date(atd.criadoEm), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `atendimentos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `Há ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays}d`;
  };

  const toggleDocRecebido = (docId: string) => {
    setNovoAtendimento(prev => ({
      ...prev,
      docsRecebidos: prev.docsRecebidos.includes(docId)
        ? prev.docsRecebidos.filter(d => d !== docId)
        : [...prev.docsRecebidos, docId],
    }));
  };

  // Selecionar o atendimento mais recente aberto para o chat central
  const atendimentoChat = selectedAtendimento || (filteredAtendimentos.length > 0 ? filteredAtendimentos[0] : null);

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Central de Suporte"
        subtitle="Suporte, documentação e atendimento ao cliente"
        icon={<HeadphonesIcon className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-hidden p-6 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-metric text-center">
            <div className="stat-icon stat-icon-yellow mx-auto mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.abertos}</p>
            <p className="text-sm text-muted-foreground">Abertos</p>
          </div>
          <div className="card-metric text-center">
            <div className="stat-icon stat-icon-blue mx-auto mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.emAndamento}</p>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </div>
          <div className="card-metric text-center">
            <div className="stat-icon stat-icon-green mx-auto mb-2">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.resolvidos}</p>
            <p className="text-sm text-muted-foreground">Resolvidos</p>
          </div>
          <div className="card-metric text-center">
            <div className="stat-icon stat-icon-purple mx-auto mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.tempoMedio}</p>
            <p className="text-sm text-muted-foreground">Tempo Médio</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atendimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="btn-primary gap-2 ml-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Atendimento
          </Button>
        </div>

        {/* Layout principal: Lista + Chat Central */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-0">
          {/* Lista lateral de tickets */}
          <div className="border border-border rounded-xl overflow-hidden flex flex-col bg-card">
            <div className="px-3 py-2 border-b border-border bg-secondary/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tickets ({filteredAtendimentos.length})
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/50">
                {filteredAtendimentos.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum atendimento</p>
                  </div>
                ) : (
                  filteredAtendimentos.map((atendimento) => (
                    <div
                      key={atendimento.id}
                      className={`px-3 py-3 cursor-pointer transition-all hover:bg-secondary/50 ${
                        atendimentoChat?.id === atendimento.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedAtendimento(atendimento)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-foreground truncate">{atendimento.clienteNome}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${origemConfig[atendimento.origem]?.color || ""}`}>
                              {origemConfig[atendimento.origem]?.label || atendimento.origem}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{atendimento.assunto}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig[atendimento.status].color}`}>
                            {statusConfig[atendimento.status].label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(atendimento.criadoEm)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[10px] ${prioridadeConfig[atendimento.prioridade].color}`}>
                          {prioridadeConfig[atendimento.prioridade].label}
                        </span>
                        <span className="text-[10px] text-primary">{atendimento.mensagens.length} msg</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat central estilo WhatsApp */}
          <div className="border border-border rounded-xl overflow-hidden flex flex-col bg-card">
            {atendimentoChat ? (
              <>
                {/* Header do chat */}
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-foreground">{atendimentoChat.clienteNome}</h3>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">{atendimentoChat.assunto}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[atendimentoChat.status].color}>
                      {statusConfig[atendimentoChat.status].label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedAtendimento(atendimentoChat); setSheetOpen(true); }}>
                          <FileText className="w-4 h-4 mr-2" /> Ver detalhes completos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAtendimento(atendimentoChat.id, { status: "resolvido" })}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Marcar Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            deleteAtendimento(atendimentoChat.id);
                            setSelectedAtendimento(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Área de mensagens estilo WhatsApp */}
                <ScrollArea className="flex-1 bg-background/50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
                  <div className="p-4 space-y-3 min-h-[200px]">
                    {atendimentoChat.mensagens.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-sm font-medium">Conversa via WhatsApp / n8n</p>
                        <p className="text-xs mt-1">As mensagens integradas aparecerão aqui</p>
                      </div>
                    ) : (
                      atendimentoChat.mensagens.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.remetente === "atendente" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm relative ${
                              msg.remetente === "atendente"
                                ? "bg-primary/90 text-primary-foreground rounded-tr-none"
                                : "bg-card text-foreground border border-border rounded-tl-none"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-semibold ${msg.remetente === "atendente" ? "text-primary-foreground/80" : "text-green-400"}`}>
                                {msg.remetente === "atendente" ? "Você" : "Cliente (WhatsApp)"}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.texto}</p>
                            <p className={`text-[10px] mt-1 text-right ${
                              msg.remetente === "atendente" ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              {format(new Date(msg.timestamp), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Input de mensagem estilo WhatsApp */}
                <ChatInput
                  onSend={(texto) => addMensagem(atendimentoChat.id, { texto, remetente: "atendente" })}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <p className="font-medium">Central de Suporte</p>
                <p className="text-sm mt-1">Selecione um ticket ou crie um novo atendimento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheet de Detalhes */}
      <AtendimentoDetailSheet
        atendimento={selectedAtendimento}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={updateAtendimento}
        onAddMensagem={addMensagem}
      />

      {/* Dialog para Novo Atendimento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Novo Atendimento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Cliente */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Cliente *</label>
              <Select
                value={novoAtendimento.clienteId}
                onValueChange={(value) =>
                  setNovoAtendimento({ ...novoAtendimento, clienteId: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum cliente disponível
                    </SelectItem>
                  ) : (
                    clientesDisponiveis.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Solicitação */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tipo de Solicitação</label>
              <Select
                value={novoAtendimento.tipoSolicitacao}
                onValueChange={(value) =>
                  setNovoAtendimento({ ...novoAtendimento, tipoSolicitacao: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duvida_tecnica">
                    <span className="flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5" /> Dúvida Técnica</span>
                  </SelectItem>
                  <SelectItem value="envio_documentos">
                    <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Envio de Documentos</span>
                  </SelectItem>
                  <SelectItem value="proposta_compra">
                    <span className="flex items-center gap-2"><Home className="w-3.5 h-3.5" /> Proposta de Compra</span>
                  </SelectItem>
                  <SelectItem value="suporte_pos_venda">
                    <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Suporte Pós-Venda</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vínculo com Imóvel */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Vínculo com Imóvel</label>
              <Select
                value={novoAtendimento.imovelId}
                onValueChange={(value) =>
                  setNovoAtendimento({ ...novoAtendimento, imovelId: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o imóvel (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {imoveisInventario.map((imovel) => (
                    <SelectItem key={imovel.id} value={imovel.id}>
                      <span className="flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 text-muted-foreground" />
                        {imovel.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assunto */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Assunto *</label>
              <Input
                placeholder="Ex: Documentação para financiamento"
                value={novoAtendimento.assunto}
                onChange={(e) =>
                  setNovoAtendimento({ ...novoAtendimento, assunto: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
              <Textarea
                placeholder="Descreva o atendimento..."
                value={novoAtendimento.descricao}
                onChange={(e) =>
                  setNovoAtendimento({ ...novoAtendimento, descricao: e.target.value })
                }
                className="bg-secondary border-border"
                rows={3}
              />
            </div>

            {/* Origem e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Origem</label>
                <Select
                  value={novoAtendimento.origem}
                  onValueChange={(value) =>
                    setNovoAtendimento({ ...novoAtendimento, origem: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
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
                <Select
                  value={novoAtendimento.prioridade}
                  onValueChange={(value: "alta" | "media" | "baixa") =>
                    setNovoAtendimento({ ...novoAtendimento, prioridade: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist de Documentos */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Checklist de Documentos
              </label>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2.5 border border-border/50">
                {documentosChecklist.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={doc.id}
                      checked={novoAtendimento.docsRecebidos.includes(doc.id)}
                      onCheckedChange={() => toggleDocRecebido(doc.id)}
                    />
                    <label
                      htmlFor={doc.id}
                      className={`text-sm cursor-pointer transition-colors ${
                        novoAtendimento.docsRecebidos.includes(doc.id)
                          ? "text-green-400 line-through"
                          : "text-foreground"
                      }`}
                    >
                      {doc.label}
                    </label>
                    {novoAtendimento.docsRecebidos.includes(doc.id) && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto" />
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground pt-1">
                  {novoAtendimento.docsRecebidos.length}/{documentosChecklist.length} documentos recebidos
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAtendimento}>Criar Atendimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de input do chat separado
function ChatInput({ onSend }: { onSend: (texto: string) => void }) {
  const [texto, setTexto] = useState("");

  const handleSend = () => {
    if (!texto.trim()) return;
    onSend(texto);
    setTexto("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-3 py-2 border-t border-border bg-secondary/30 flex items-center gap-2">
      <Input
        placeholder="Digite uma mensagem..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-background border-border flex-1"
      />
      <Button onClick={handleSend} disabled={!texto.trim()} size="icon" className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
        <SendIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
