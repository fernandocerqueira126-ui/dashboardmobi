import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Phone,
  Search,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Mic,
  MessageSquare,
  CheckCircle,
  FileText,
  Trash2,
  CheckCheck,
  Check,
  Clock,
  ArrowDown,
} from "lucide-react";
import { Atendimento, Mensagem } from "@/contexts/AtendimentosContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatPanelProps {
  atendimento: Atendimento | null;
  onSendMessage: (atendimentoId: string, mensagem: Omit<Mensagem, "id" | "timestamp">) => void;
  onUpdateStatus: (id: string, data: Partial<Atendimento>) => void;
  onDelete: (id: string) => void;
  onOpenDetails: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-yellow-500/20 text-yellow-400" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400" },
  resolvido: { label: "Resolvido", color: "bg-emerald-500/20 text-emerald-400" },
};

export function ChatPanel({
  atendimento,
  onSendMessage,
  onUpdateStatus,
  onDelete,
  onOpenDetails,
}: ChatPanelProps) {
  const [texto, setTexto] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [atendimento?.mensagens]);

  if (!atendimento) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background/30 relative overflow-hidden">
        {/* WhatsApp-style empty state pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10 text-center">
          <div className="w-[200px] h-[200px] mx-auto mb-6 rounded-full bg-secondary/30 flex items-center justify-center">
            <MessageSquare className="w-24 h-24 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-light text-foreground mb-2">Dashboard Mobi Web</h2>
          <p className="text-sm text-muted-foreground max-w-[400px]">
            Envie e receba mensagens sincronizadas com o WhatsApp via n8n.
            <br />
            Selecione uma conversa para começar.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/50">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="text-xs">Conectado ao n8n</span>
          </div>
        </div>
        {/* Bottom bar decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30" />
      </div>
    );
  }

  const handleSend = () => {
    if (!texto.trim()) return;
    onSendMessage(atendimento.id, { texto, remetente: "atendente" });
    setTexto("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Mensagem[] }[] = [];
  atendimento.mensagens.forEach((msg) => {
    const dateStr = format(new Date(msg.timestamp), "dd/MM/yyyy");
    const group = groupedMessages.find((g) => g.date === dateStr);
    if (group) {
      group.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  const getDateLabel = (dateStr: string) => {
    const today = format(new Date(), "dd/MM/yyyy");
    const yesterday = format(new Date(Date.now() - 86400000), "dd/MM/yyyy");
    if (dateStr === today) return "Hoje";
    if (dateStr === yesterday) return "Ontem";
    return dateStr;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenDetails}>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
            {atendimento.clienteNome.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-sm text-foreground leading-tight">
              {atendimento.clienteNome}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {atendimento.assunto}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Badge className={`${statusLabels[atendimento.status]?.color} text-[10px] px-2`}>
            {statusLabels[atendimento.status]?.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenDetails}>
                <FileText className="w-4 h-4 mr-2" /> Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(atendimento.id, { status: "em_andamento" })}>
                <Clock className="w-4 h-4 mr-2" /> Em Andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(atendimento.id, { status: "resolvido" })}>
                <CheckCircle className="w-4 h-4 mr-2" /> Resolver
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(atendimento.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea
        className="flex-1"
        style={{
          background: `hsl(var(--background))`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="px-[10%] py-4 space-y-1">
          {atendimento.mensagens.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-muted-foreground shadow-sm border border-border/30">
                🔗 Conversa sincronizada via WhatsApp / n8n
              </div>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex justify-center my-3">
                  <span className="bg-card/90 backdrop-blur-sm text-muted-foreground text-[11px] px-3 py-1 rounded-lg shadow-sm border border-border/20">
                    {getDateLabel(group.date)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg, idx) => {
                  const isAtendente = msg.remetente === "atendente";
                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-1 ${isAtendente ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm ${
                          isAtendente
                            ? "bg-primary/90 text-primary-foreground rounded-tr-[4px]"
                            : "bg-card text-foreground border border-border/40 rounded-tl-[4px]"
                        }`}
                      >
                        {/* Tail */}
                        {idx === 0 && (
                          <div
                            className={`absolute top-0 w-2 h-3 ${
                              isAtendente
                                ? "right-[-6px] border-l-[6px] border-l-primary/90 border-t-[6px] border-t-transparent"
                                : "left-[-6px] border-r-[6px] border-r-card border-t-[6px] border-t-transparent"
                            }`}
                          />
                        )}

                        {!isAtendente && (
                          <p className="text-[11px] font-medium text-primary mb-0.5">
                            {atendimento.clienteNome}
                          </p>
                        )}

                        <p className="text-[13px] leading-relaxed pr-12">{msg.texto}</p>

                        <span className={`absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] ${
                          isAtendente ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}>
                          {format(new Date(msg.timestamp), "HH:mm")}
                          {isAtendente && (
                            <CheckCheck className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Bar - WhatsApp style */}
      <div className="px-3 py-2 bg-secondary/40 border-t border-border flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0">
          <Smile className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0">
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          placeholder="Digite uma mensagem"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-9 bg-background border-border/50 rounded-lg text-sm"
        />
        {texto.trim() ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-primary hover:bg-primary/80"
          >
            <Send className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0">
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
