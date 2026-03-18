import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserCircle,
  Search,
  Filter,
  Plus,
  Download,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeads } from "@/contexts/LeadsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ClienteDetailSheet, ClienteDetails, ClienteArquivo } from "@/components/clientes/ClienteDetailSheet";

export default function Clientes() {
  const { leads, updateLead } = useLeads();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDetails | null>(null);
  const [manualClientes, setManualClientes] = useState<ClienteDetails[]>([]);
  
  // Form state for quick add
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Ativo" as "Ativo" | "Inativo",
  });

  // Clientes derivados dos leads com status "ganho" (Fechado Ganho)
  const clientesFromLeads: ClienteDetails[] = useMemo(() => {
    return leads
      .filter((lead) => lead.status === "ganho")
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        createdAt: lead.date,
        status: "Ativo" as const,
        totalSpent: lead.paidValue || lead.value,
        source: lead.source,
        fromLead: true,
        servico: lead.description,
        valorContrato: lead.value,
      }));
  }, [leads]);

  // Combinar clientes de leads + clientes manuais
  const allClientes = useMemo(() => {
    // Merge: se um cliente manual tem o mesmo ID que um de lead, usar dados mesclados
    const clientesMap = new Map<string, ClienteDetails>();
    
    clientesFromLeads.forEach((c) => {
      clientesMap.set(c.id, c);
    });
    
    manualClientes.forEach((c) => {
      if (clientesMap.has(c.id)) {
        // Mesclar dados
        clientesMap.set(c.id, { ...clientesMap.get(c.id), ...c });
      } else {
        clientesMap.set(c.id, c);
      }
    });
    
    return Array.from(clientesMap.values());
  }, [clientesFromLeads, manualClientes]);

  // Filtrar clientes
  const filteredClientes = useMemo(() => {
    return allClientes.filter((cliente) => {
      const matchesSearch =
        cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.phone.includes(searchTerm);
      const matchesStatus =
        statusFilter === "todos" || cliente.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allClientes, searchTerm, statusFilter]);

  const handleAddCliente = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newCliente: ClienteDetails = {
      id: `cliente-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      status: formData.status,
      totalSpent: 0,
      source: "Manual",
      fromLead: false,
    };
    
    setManualClientes((prev) => [...prev, newCliente]);
    toast({
      title: "Cliente adicionado",
      description: `${formData.name} foi adicionado com sucesso`,
    });

    resetForm();
  };

  const handleOpenDetail = (cliente: ClienteDetails) => {
    setSelectedCliente(cliente);
    setIsDetailSheetOpen(true);
  };

  const handleSaveCliente = (updatedCliente: ClienteDetails) => {
    if (updatedCliente.fromLead) {
      // Atualizar lead no contexto global
      updateLead(updatedCliente.id, {
        name: updatedCliente.name,
        email: updatedCliente.email,
        phone: updatedCliente.phone,
        description: updatedCliente.servico,
        value: updatedCliente.valorContrato || 0,
      });
    }
    
    // Salvar dados extras no estado local
    setManualClientes((prev) => {
      const existing = prev.find((c) => c.id === updatedCliente.id);
      if (existing) {
        return prev.map((c) => (c.id === updatedCliente.id ? updatedCliente : c));
      }
      return [...prev, updatedCliente];
    });
  };

  const handleDeleteCliente = (cliente: ClienteDetails) => {
    if (cliente.fromLead) {
      toast({
        title: "Atenção",
        description: "Para remover um cliente convertido, mova o lead de volta no CRM",
        variant: "destructive",
      });
    } else {
      setManualClientes((prev) => prev.filter((c) => c.id !== cliente.id));
      toast({
        title: "Cliente removido",
        description: `${cliente.name} foi removido com sucesso`,
      });
    }
  };

  const handleToggleStatus = (cliente: ClienteDetails) => {
    const newStatus = cliente.status === "Ativo" ? "Inativo" : "Ativo";
    if (!cliente.fromLead) {
      setManualClientes((prev) =>
        prev.map((c) =>
          c.id === cliente.id ? { ...c, status: newStatus } : c
        )
      );
      toast({
        title: "Status atualizado",
        description: `${cliente.name} agora está ${newStatus}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", status: "Ativo" });
    setIsDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Cadastro", "Status", "Total Gasto", "Origem"];
    const rows = filteredClientes.map((c) => [
      c.name,
      c.email,
      c.phone,
      formatDate(c.createdAt),
      c.status,
      formatCurrency(c.totalSpent),
      c.source,
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast({
      title: "Exportado",
      description: `${filteredClientes.length} clientes exportados com sucesso`,
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header
        title="Proprietários / Clientes"
        subtitle="Gerencie sua carteira de clientes convertidos e clientes diretos"
        icon={<UserCircle className="w-5 h-5 text-emerald-500" />}
      />

      <div className="flex-1 flex flex-col p-6 overflow-hidden gap-6 max-w-[1600px] mx-auto w-full">
        {/* Top Actions Bar - Dashboard style */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-secondary/30 border border-border/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm rounded-none">
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border border-border/50 shadow-2xl rounded-none">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight">Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase">Nome *</Label>
                    <Input id="name" placeholder="Nome do cliente" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-secondary/50 border-border/50 rounded-none focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase">Email *</Label>
                    <Input id="email" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-secondary/50 border-border/50 rounded-none focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase">Telefone *</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-secondary/50 border-border/50 rounded-none focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground uppercase">Status</Label>
                    <Select value={formData.status} onValueChange={(value: "Ativo" | "Inativo") => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-secondary/50 border-border/50 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-4">
                    <Button variant="ghost" onClick={resetForm} className="rounded-none hover:bg-destructive/10 hover:text-destructive">Cancelar</Button>
                    <Button onClick={handleAddCliente} className="bg-emerald-600 hover:bg-emerald-700 rounded-none">Adicionar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2 border-border/50 hover:bg-secondary/50 rounded-none transition-colors" onClick={exportCSV}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button variant="outline" className="gap-2 border-border/50 hover:bg-secondary/50 rounded-none transition-colors">
              <UserCircle className="w-4 h-4" />
              Contatos
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background border-border/50 rounded-none h-9 hover:border-border transition-colors">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border/50 shadow-xl">
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unified Metrics Strip - Flight Dashboard Style */}
        <div className="flex bg-secondary/20 border border-border/40 rounded-lg overflow-hidden shrink-0 shadow-sm backdrop-blur-sm">
          <div className="flex-1 p-5 border-r border-border/30 hover:bg-secondary/30 transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <UserCircle className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Clientes</p>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono">{allClientes.length}</p>
          </div>
          
          <div className="flex-1 p-5 border-r border-border/30 hover:bg-secondary/30 transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativos</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400 font-mono">{allClientes.filter((c) => c.status === "Ativo").length}</p>
          </div>

          <div className="flex-1 p-5 border-r border-border/30 hover:bg-secondary/30 transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inativos</p>
            </div>
            <p className="text-3xl font-bold text-rose-400 font-mono">{allClientes.filter((c) => c.status === "Inativo").length}</p>
          </div>

          <div className="flex-[1.5] p-5 hover:bg-secondary/30 transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500 font-bold text-xs">$</span>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faturamento Total</p>
            </div>
            <p className="text-3xl font-bold text-amber-400 font-mono tracking-tight">
              {formatCurrency(allClientes.reduce((acc, c) => acc + c.totalSpent, 0))}
            </p>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="flex-1 flex flex-col bg-card border border-border/40 rounded-lg overflow-hidden shadow-lg relative">
          
          {/* Table Controls */}
          <div className="flex items-center justify-between p-3 border-b border-border/40 bg-secondary/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground px-2">Ações rápidas:</span>
              <Button variant="outline" size="sm" className="h-8 rounded-none border-border/50 text-xs gap-2" onClick={exportCSV}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-none border-border/50 text-xs gap-2" disabled>
                Ações em Massa
              </Button>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Procurar (nome, email, tel)..."
                className="h-8 pl-9 bg-background border-border/50 rounded-none focus-visible:ring-emerald-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actual Table */}
          <div className="flex-1 overflow-auto">
            {filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 border border-border/50 shadow-inner">
                  <UserCircle className="w-8 h-8 opacity-40 text-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground tracking-tight">Nenhum cliente registrado</p>
                <p className="text-sm mt-1 max-w-sm">
                  Adicione clientes manualmente ou feche contratos no CRM (movendo leads para "Fechado") para povoar esta lista.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm text-left relative">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/20 sticky top-0 z-10 shadow-sm border-b border-border/50 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-12">#</th>
                    <th className="px-6 py-4 font-semibold">Cliente e Empresa</th>
                    <th className="px-6 py-4 font-semibold">Contato</th>
                    <th className="px-6 py-4 font-semibold w-32">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Faturamento</th>
                    <th className="px-6 py-4 font-semibold w-24">Origem</th>
                    <th className="px-6 py-4 font-semibold text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredClientes.map((cliente, index) => (
                    <tr
                      key={cliente.id}
                      onClick={() => handleOpenDetail(cliente)}
                      className="group hover:bg-secondary/40 transition-all duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {(index + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-border/50 shadow-sm group-hover:border-emerald-500/50 transition-colors">
                            <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                              {cliente.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                              {cliente.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {cliente.fromLead ? (
                                <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-1.5 rounded-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  Vindo do CRM
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 rounded-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Cadastro Direto
                                </span>
                              )}
                              • {formatDate(cliente.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                            <Mail className="w-3.5 h-3.5 opacity-70" />
                            <span className="truncate max-w-[180px]">{cliente.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                            <Phone className="w-3.5 h-3.5 opacity-70" />
                            <span>{cliente.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(cliente);
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-semibold transition-all border ${
                            cliente.status === "Ativo"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cliente.status === "Ativo" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {cliente.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-medium text-amber-400 tracking-tight">
                          {formatCurrency(cliente.totalSpent)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs uppercase font-semibold text-muted-foreground bg-secondary/50 px-2 py-1 border border-border/30 rounded-sm inline-block">
                          {cliente.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-none transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border border-border/50 shadow-xl rounded-none w-48">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(cliente);
                            }} className="cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50">
                              <Eye className="w-4 h-4 mr-2 text-blue-400" />
                              Ver Ficha Completa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(cliente);
                            }} className="cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCliente(cliente);
                              }}
                              className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      <ClienteDetailSheet
        cliente={selectedCliente}
        open={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedCliente(null);
        }}
        onSave={handleSaveCliente}
      />
    </div>
  );
}
