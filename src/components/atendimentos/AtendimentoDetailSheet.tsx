import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Atendimento, Mensagem } from "@/contexts/AtendimentosContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AtendimentoDetailSheetProps {
  atendimento: Atendimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Atendimento>) => void;
  onAddMensagem: (atendimentoId: string, mensagem: Omit<Mensagem, "id" | "timestamp">) => void;
}

const statusConfig = {
  aberto: { label: "Aberto", color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  resolvido: { label: "Resolvido", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
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

export function AtendimentoDetailSheet({
  atendimento,
  open,
  onOpenChange,
  onUpdate,
  onAddMensagem,
}: AtendimentoDetailSheetProps) {
  const [novaMensagem, setNovaMensagem] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [atendimento?.mensagens]);

  if (!atendimento) return null;

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) return;
    
    onAddMensagem(atendimento.id, {
      texto: novaMensagem,
      remetente: "atendente",
    });
    setNovaMensagem("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  const StatusIcon = statusConfig[atendimento.status].icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl bg-card border-border overflow-hidden flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {atendimento.clienteNome}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{atendimento.assunto}</p>
            </div>
            <Badge className={origemConfig[atendimento.origem].color}>
              {origemConfig[atendimento.origem].label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden py-4">
          {/* Info do Cliente */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-secondary/50 rounded-lg">
            {atendimento.clienteEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{atendimento.clienteEmail}</span>
              </div>
            )}
            {atendimento.clienteTelefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{atendimento.clienteTelefone}</span>
              </div>
            )}
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select
                value={atendimento.status}
                onValueChange={(value: "aberto" | "em_andamento" | "resolvido") =>
                  onUpdate(atendimento.id, { status: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
              <Select
                value={atendimento.prioridade}
                onValueChange={(value: "alta" | "media" | "baixa") =>
                  onUpdate(atendimento.id, { prioridade: value })
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

          {/* Chat de Mensagens */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Conversa</span>
            </div>

            <ScrollArea className="flex-1 border border-border rounded-lg p-3 bg-background">
              <div className="space-y-3">
                {atendimento.mensagens.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma mensagem ainda. Inicie a conversa!
                  </p>
                ) : (
                  atendimento.mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.remetente === "atendente" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.remetente === "atendente"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.texto}</p>
                        <p className={`text-xs mt-1 ${
                          msg.remetente === "atendente" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {format(new Date(msg.timestamp), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Digite sua mensagem..."
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-secondary border-border"
              />
              <Button onClick={handleEnviarMensagem} disabled={!novaMensagem.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Info adicional */}
          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex justify-between">
            <span>
              Criado em: {format(new Date(atendimento.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            <span>
              Atualizado: {format(new Date(atendimento.atualizadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
