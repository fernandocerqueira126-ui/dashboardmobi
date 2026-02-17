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
    <div className="flex flex-col h-screen">
      <Header
        title="Clientes"
        subtitle="Gerencie sua base de clientes"
        icon={<UserCircle className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-9 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="btn-outline gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2 ml-auto">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do cliente"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Ativo" | "Inativo") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddCliente}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-metric p-4">
            <p className="text-sm text-muted-foreground">Total de Clientes</p>
            <p className="text-2xl font-bold text-foreground">{allClientes.length}</p>
          </div>
          <div className="card-metric p-4">
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            <p className="text-2xl font-bold text-success">
              {allClientes.filter((c) => c.status === "Ativo").length}
            </p>
          </div>
          <div className="card-metric p-4">
            <p className="text-sm text-muted-foreground">Faturamento Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(allClientes.reduce((acc, c) => acc + c.totalSpent, 0))}
            </p>
          </div>
        </div>

        {/* Clients Table */}
        <div className="card-metric overflow-hidden">
          {filteredClientes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm mt-1">
                Clientes aparecerão aqui quando leads forem movidos para "Fechado Ganho"
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Contato
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Cadastro
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Total Gasto
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Origem
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(cliente)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {cliente.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-foreground">
                            {cliente.name}
                          </span>
                          {cliente.fromLead && (
                            <span className="ml-2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                              CRM
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {cliente.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cliente.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(cliente);
                        }}
                        className={`badge-status cursor-pointer hover:opacity-80 transition-opacity ${
                          cliente.status === "Ativo"
                            ? "badge-paid"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {cliente.status}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-success">
                        {formatCurrency(cliente.totalSpent)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {cliente.source}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(cliente);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Ficha Completa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCliente(cliente);
                            }}
                            className="text-destructive"
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
