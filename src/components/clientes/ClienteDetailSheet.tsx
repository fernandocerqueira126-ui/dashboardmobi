import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  Briefcase,
  Upload,
  X,
  File,
  Image,
  FileSpreadsheet,
  Download,
  Trash2,
  Save,
  Mail,
  Phone,
  Building,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface ClienteArquivo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUpload: string;
  url?: string;
}

export interface ClienteDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "Ativo" | "Inativo";
  totalSpent: number;
  source: string;
  fromLead?: boolean;
  // Documentos
  cpfCnpj?: string;
  rg?: string;
  inscricaoEstadual?: string;
  // Endereço
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // Briefing
  briefing?: string;
  objetivos?: string;
  observacoes?: string;
  // Serviço
  servico?: string;
  valorContrato?: number;
  dataInicio?: string;
  dataPrevisaoFim?: string;
  statusProjeto?: "Em andamento" | "Pausado" | "Concluído" | "Cancelado";
  // Arquivos
  arquivos?: ClienteArquivo[];
}

interface ClienteDetailSheetProps {
  cliente: ClienteDetails | null;
  open: boolean;
  onClose: () => void;
  onSave: (cliente: ClienteDetails) => void;
}

export function ClienteDetailSheet({
  cliente,
  open,
  onClose,
  onSave,
}: ClienteDetailSheetProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("dados");
  const [formData, setFormData] = useState<ClienteDetails | null>(cliente);
  const [arquivos, setArquivos] = useState<ClienteArquivo[]>(cliente?.arquivos || []);

  // Atualiza formData quando cliente muda
  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
      setArquivos(cliente.arquivos || []);
    }
  }, [cliente]);

  if (!cliente || !formData) return null;

  const handleInputChange = (field: keyof ClienteDetails, value: string | number) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newArquivos: ClienteArquivo[] = [];
    Array.from(files).forEach((file) => {
      const arquivo: ClienteArquivo = {
        id: `arquivo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        dataUpload: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };
      newArquivos.push(arquivo);
    });

    setArquivos((prev) => [...prev, ...newArquivos]);
    toast({
      title: "Arquivos adicionados",
      description: `${newArquivos.length} arquivo(s) adicionado(s) com sucesso`,
    });

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setArquivos((prev) => prev.filter((a) => a.id !== fileId));
    toast({
      title: "Arquivo removido",
      description: "Arquivo removido com sucesso",
    });
  };

  const handleSave = () => {
    if (formData) {
      onSave({ ...formData, arquivos });
      toast({
        title: "Cliente atualizado",
        description: `${formData.name} foi atualizado com sucesso`,
      });
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) return <Image className="w-5 h-5 text-primary" />;
    if (tipo.includes("spreadsheet") || tipo.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-success" />;
    if (tipo.includes("pdf")) return <FileText className="w-5 h-5 text-destructive" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {formData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl">{formData.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={formData.status === "Ativo" ? "default" : "secondary"}>
                  {formData.status}
                </Badge>
                {formData.fromLead && (
                  <Badge variant="outline">Via CRM</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Cliente desde {format(new Date(formData.createdAt), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dados" className="gap-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="briefing" className="gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Briefing</span>
            </TabsTrigger>
            <TabsTrigger value="servico" className="gap-1">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Serviço</span>
            </TabsTrigger>
            <TabsTrigger value="arquivos" className="gap-1">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Arquivos</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB DADOS */}
          <TabsContent value="dados" className="space-y-6">
            {/* Contato */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Informações de Contato
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Ativo" | "Inativo") =>
                      handleInputChange("status", value)
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
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={formData.cpfCnpj || ""}
                    onChange={(e) => handleInputChange("cpfCnpj", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    placeholder="00.000.000-0"
                    value={formData.rg || ""}
                    onChange={(e) => handleInputChange("rg", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricaoEstadual"
                    placeholder="Inscrição estadual (se aplicável)"
                    value={formData.inscricaoEstadual || ""}
                    onChange={(e) => handleInputChange("inscricaoEstadual", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, complemento"
                    value={formData.endereco || ""}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade || ""}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      placeholder="UF"
                      maxLength={2}
                      value={formData.estado || ""}
                      onChange={(e) => handleInputChange("estado", e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep || ""}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB BRIEFING */}
          <TabsContent value="briefing" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="briefing">Briefing do Projeto</Label>
                <Textarea
                  id="briefing"
                  placeholder="Descreva o briefing completo do cliente, incluindo necessidades, expectativas, histórico..."
                  className="min-h-[150px]"
                  value={formData.briefing || ""}
                  onChange={(e) => handleInputChange("briefing", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objetivos">Objetivos</Label>
                <Textarea
                  id="objetivos"
                  placeholder="Quais são os principais objetivos do cliente?"
                  className="min-h-[100px]"
                  value={formData.objetivos || ""}
                  onChange={(e) => handleInputChange("objetivos", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações importantes, preferências, pontos de atenção..."
                  className="min-h-[100px]"
                  value={formData.observacoes || ""}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB SERVIÇO */}
          <TabsContent value="servico" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="servico">Serviço Contratado</Label>
                <Textarea
                  id="servico"
                  placeholder="Descreva o serviço ou produto contratado pelo cliente"
                  className="min-h-[100px]"
                  value={formData.servico || ""}
                  onChange={(e) => handleInputChange("servico", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorContrato">Valor do Contrato</Label>
                  <Input
                    id="valorContrato"
                    type="number"
                    placeholder="0,00"
                    value={formData.valorContrato || ""}
                    onChange={(e) => handleInputChange("valorContrato", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusProjeto">Status do Projeto</Label>
                  <Select
                    value={formData.statusProjeto || "Em andamento"}
                    onValueChange={(value) => handleInputChange("statusProjeto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio || ""}
                    onChange={(e) => handleInputChange("dataInicio", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPrevisaoFim">Previsão de Conclusão</Label>
                  <Input
                    id="dataPrevisaoFim"
                    type="date"
                    value={formData.dataPrevisaoFim || ""}
                    onChange={(e) => handleInputChange("dataPrevisaoFim", e.target.value)}
                  />
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-3">Resumo Financeiro</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pago</p>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(formData.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Contrato</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(formData.valorContrato || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB ARQUIVOS */}
          <TabsContent value="arquivos" className="space-y-6">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
              />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Clique para fazer upload ou arraste arquivos aqui
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, XLS, Imagens (máx. 20MB)
              </p>
            </div>

            {/* Lista de Arquivos */}
            {arquivos.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Arquivos ({arquivos.length})
                </h4>
                <div className="space-y-2">
                  {arquivos.map((arquivo) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(arquivo.tipo)}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {arquivo.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(arquivo.tamanho)} • {format(new Date(arquivo.dataUpload), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {arquivo.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(arquivo.url, "_blank")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFile(arquivo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum arquivo anexado</p>
                <p className="text-xs mt-1">
                  Faça upload de documentos, contratos, briefings...
                </p>
              </div>
            )}

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Nota:</strong> Para persistir arquivos permanentemente, 
                habilite o Lovable Cloud. Arquivos atuais são armazenados apenas localmente.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
