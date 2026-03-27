import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Plus,
  MessageSquare,
  User,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Atendimento } from "@/contexts/AtendimentosContext";
import { format } from "date-fns";

interface ConversationListProps {
  atendimentos: Atendimento[];
  selectedId: string | null;
  onSelect: (atendimento: Atendimento) => void;
  onNewClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const statusColors: Record<string, string> = {
  aberto: "border-l-yellow-500",
  em_andamento: "border-l-blue-500",
  resolvido: "border-l-emerald-500",
};

const origemIcons: Record<string, string> = {
  whatsapp: "🟢",
  email: "📧",
  telefone: "📞",
  presencial: "🏢",
  crm: "💼",
};

export function ConversationList({
  atendimentos,
  selectedId,
  onSelect,
  onNewClick,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ConversationListProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return format(d, "HH:mm");
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return format(d, "EEE");
    return format(d, "dd/MM/yyyy");
  };

  const getLastMessage = (atd: Atendimento) => {
    if (atd.mensagens.length === 0) return "Nenhuma mensagem ainda";
    const last = atd.mensagens[atd.mensagens.length - 1];
    const prefix = last.remetente === "atendente" ? "Você: " : "";
    return `${prefix}${last.texto}`;
  };

  const getUnreadCount = (atd: Atendimento) => {
    // Simulate unread: count client messages (in real app, track read status)
    return atd.mensagens.filter(m => m.remetente === "cliente").length > 0 && atd.status !== "resolvido"
      ? atd.mensagens.filter(m => m.remetente === "cliente").slice(-1).length
      : 0;
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Conversas</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onNewClick}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="px-3 py-2 space-y-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar ou começar nova conversa"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8 text-sm bg-secondary/60 border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5">
          {["todos", "aberto", "em_andamento", "resolvido"].map((status) => (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {status === "todos" ? "Tudo" : status === "aberto" ? "Abertos" : status === "em_andamento" ? "Andamento" : "Resolvidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {atendimentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
          </div>
        ) : (
          <div>
            {atendimentos.map((atd) => {
              const isSelected = selectedId === atd.id;
              const lastMsg = getLastMessage(atd);
              const unread = getUnreadCount(atd);
              const lastTime = atd.mensagens.length > 0
                ? atd.mensagens[atd.mensagens.length - 1].timestamp
                : atd.criadoEm;

              return (
                <div
                  key={atd.id}
                  onClick={() => onSelect(atd)}
                  className={`flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors border-l-2 ${
                    isSelected
                      ? "bg-primary/10 border-l-primary"
                      : `border-l-transparent hover:bg-secondary/40`
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isSelected ? "bg-primary/30 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {(atd.clienteNome || "??").substring(0, 2).toUpperCase()}
                    </div>
                    {atd.status !== "resolvido" && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                        atd.status === "aberto" ? "bg-yellow-500" : "bg-blue-500"
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">
                        {atd.clienteNome}
                      </span>
                      <span className={`text-[11px] shrink-0 ml-2 ${
                        unread > 0 ? "text-primary font-medium" : "text-muted-foreground"
                      }`}>
                        {formatTime(lastTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate pr-2 flex items-center gap-1">
                        {atd.mensagens.length > 0 && atd.mensagens[atd.mensagens.length - 1].remetente === "atendente" && (
                          <CheckCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                        {lastMsg}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {atd.origem && (
                          <span className="text-[10px]">{origemIcons[atd.origem] || ""}</span>
                        )}
                        {unread > 0 && (
                          <span className="w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
