import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UsersRound,
  Search,
  Plus,
  Mail,
  Phone,
  Briefcase,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useColaboradores, Colaborador } from "@/contexts/ColaboradoresContext";

const roleOptions = [
  "Analista",
  "Especialista",
  "Gerente",
  "Coordenador",
  "Desenvolvedor",
  "Designer",
  "Assistente",
  "Estagiário",
];

export default function Colaboradores() {
  const { colaboradores, isLoading, addColaborador, updateColaborador, deleteColaborador, toggleStatus } = useColaboradores();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [colaboradorToDelete, setColaboradorToDelete] = useState<Colaborador | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    status: "ativo" as "ativo" | "inativo",
  });

  // Filtered colaboradores
  const filteredColaboradores = useMemo(() => {
    return colaboradores.filter((colab) => {
      const matchesSearch = searchTerm === "" ||
        colab.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (colab.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (colab.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesStatus = filterStatus === "todos" || colab.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [colaboradores, searchTerm, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = colaboradores.length;
    const ativos = colaboradores.filter(c => c.status === "ativo").length;
    const inativos = colaboradores.filter(c => c.status === "inativo").length;
    return { total, ativos, inativos };
  }, [colaboradores]);

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      cargo: "",
      status: "ativo",
    });
    setEditingColaborador(null);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsModalOpen(open);
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email || !formData.cargo) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (editingColaborador) {
      await updateColaborador(editingColaborador.id, formData);
    } else {
      await addColaborador(formData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setFormData({
      nome: colaborador.nome,
      email: colaborador.email || "",
      telefone: colaborador.telefone || "",
      cargo: colaborador.cargo || "",
      status: colaborador.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (colaborador: Colaborador) => {
    setColaboradorToDelete(colaborador);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (colaboradorToDelete) {
      await deleteColaborador(colaboradorToDelete.id);
      setColaboradorToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleStatus = (colaborador: Colaborador) => {
    toggleStatus(colaborador.id);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (isLoading && colaboradores.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Colaboradores" subtitle="Gerencie sua equipe" icon={<UsersRound className="w-5 h-5" />} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Colaboradores"
        subtitle="Gerencie sua equipe"
        icon={<UsersRound className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-success">{stats.ativos}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div className="card-metric flex-1 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.inativos}</p>
            <p className="text-xs text-muted-foreground">Inativos</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaboradores..."
              className="pl-9 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button className="btn-primary gap-2 ml-auto" onClick={handleAddNew}>
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Button>
        </div>

        {/* Collaborators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredColaboradores.map((colab) => (
            <div key={colab.id} className={cn(
              "card-metric transition-opacity",
              colab.status === "inativo" && "opacity-60"
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {colab.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{colab.nome}</h3>
                    <p className="text-sm text-primary">{colab.cargo}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(colab)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(colab)}>
                      {colab.status === "ativo" ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(colab)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {colab.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {colab.telefone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <span className={cn(
                  "badge-status",
                  colab.status === "ativo" ? "badge-paid" : "bg-muted text-muted-foreground"
                )}>
                  {colab.status}
                </span>
              </div>
            </div>
          ))}

          {filteredColaboradores.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12">
              <UsersRound className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum colaborador encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "todos"
                  ? "Tente ajustar os filtros de busca."
                  : "Adicione seu primeiro colaborador clicando no botão acima."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo/Editar Colaborador */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingColaborador ? (
                <>
                  <Pencil className="w-5 h-5 text-primary" />
                  Editar Colaborador
                </>
              ) : (
                <>
                  <User className="w-5 h-5 text-primary" />
                  Novo Colaborador
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do colaborador. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Nome do colaborador"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    className="pl-9"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Select value={formData.cargo} onValueChange={(value) => handleInputChange("cargo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleModalClose(false)}>
              Cancelar
            </Button>
            <Button className="btn-primary gap-2" onClick={handleSubmit}>
              {editingColaborador ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{colaboradorToDelete?.nome}</strong> da equipe?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setColaboradorToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

