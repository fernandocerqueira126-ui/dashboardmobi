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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Headphones,
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
} from "lucide-react";
import { useAtendimentos, Atendimento } from "@/contexts/AtendimentosContext";
import { useLeads } from "@/contexts/LeadsContext";
import { AtendimentoDetailSheet } from "@/components/atendimentos/AtendimentoDetailSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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

const origemConfig = {
  whatsapp: { label: "WhatsApp", color: "bg-green-500/20 text-green-400" },
  email: { label: "E-mail", color: "bg-blue-500/20 text-blue-400" },
  telefone: { label: "Telefone", color: "bg-purple-500/20 text-purple-400" },
  presencial: { label: "Presencial", color: "bg-orange-500/20 text-orange-400" },
  crm: { label: "CRM", color: "bg-primary/20 text-primary" },
};

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
    origem: "whatsapp" as "whatsapp" | "email" | "telefone" | "presencial" | "crm",
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

    addAtendimento({
      clienteId: cliente.id,
      clienteNome: cliente.name,
      clienteEmail: cliente.email || null,
      clienteTelefone: cliente.phone || null,
      assunto: novoAtendimento.assunto,
      status: "aberto",
      prioridade: novoAtendimento.prioridade,
      origem: novoAtendimento.origem,
      colaborador: "Equipe",
    });

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
    });
  };

  const handleExportCSV = () => {
    const headers = ["Cliente", "Assunto", "Status", "Prioridade", "Origem", "Criado em"];
    const rows = filteredAtendimentos.map(atd => [
      atd.clienteNome,
      atd.assunto,
      statusConfig[atd.status].label,
      prioridadeConfig[atd.prioridade].label,
      origemConfig[atd.origem].label,
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

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Atendimentos"
        subtitle="Central de atendimento ao cliente"
        icon={<Headphones className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
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

        {/* Lista de Atendimentos */}
        <div className="space-y-3">
          {filteredAtendimentos.length === 0 ? (
            <div className="card-metric text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum atendimento encontrado</p>
              {clientesDisponiveis.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Converta leads para "Fechado Ganho" no CRM para criar atendimentos
                </p>
              )}
            </div>
          ) : (
            filteredAtendimentos.map((atendimento) => (
              <div
                key={atendimento.id}
                className="card-metric hover:border-primary/30 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedAtendimento(atendimento);
                  setSheetOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{atendimento.clienteNome}</h3>
                        <Badge variant="outline" className={origemConfig[atendimento.origem].color}>
                          {origemConfig[atendimento.origem].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{atendimento.assunto}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={statusConfig[atendimento.status].color}>
                        {statusConfig[atendimento.status].label}
                      </Badge>
                      <p className={`text-xs mt-1 ${prioridadeConfig[atendimento.prioridade].color}`}>
                        Prioridade: {prioridadeConfig[atendimento.prioridade].label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatTimeAgo(atendimento.criadoEm)}</p>
                      <p className="text-xs text-primary">
                        {atendimento.mensagens.length} mensagens
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAtendimento(atendimento.id, { status: "resolvido" });
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAtendimento(atendimento.id);
                            toast({
                              title: "Atendimento removido",
                              description: "O atendimento foi excluído",
                            });
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
            ))
          )}
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Atendimento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Assunto *</label>
              <Input
                placeholder="Ex: Dúvida sobre serviço"
                value={novoAtendimento.assunto}
                onChange={(e) =>
                  setNovoAtendimento({ ...novoAtendimento, assunto: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
              <Textarea
                placeholder="Descreva o atendimento..."
                value={novoAtendimento.descricao}
                onChange={(e) =>
                  setNovoAtendimento({ ...novoAtendimento, descricao: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Origem</label>
                <Select
                  value={novoAtendimento.origem}
                  onValueChange={(value: "whatsapp" | "email" | "telefone" | "presencial" | "crm") =>
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
