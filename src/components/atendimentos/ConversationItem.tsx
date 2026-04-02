import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCheck } from "lucide-react";
import { Atendimento } from "@/contexts/AtendimentosContext";
import { format } from "date-fns";

interface ConversationItemProps {
  atendimento: Atendimento;
  isSelected: boolean;
  onSelect: (atendimento: Atendimento) => void;
}

const origemIcons: Record<string, string> = {
  whatsapp: "🟢",
  email: "📧",
  telefone: "📞",
  presencial: "🏢",
  crm: "💼",
};

const priorityColors: Record<string, string> = {
  alta: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
  media: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20",
  baixa: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "text-amber-500" },
  em_andamento: { label: "Andamento", color: "text-blue-500" },
  resolvido: { label: "Resolvido", color: "text-emerald-500" },
};

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
  return atd.mensagens.filter(m => m.remetente === "cliente").length > 0 && atd.status !== "resolvido"
    ? atd.mensagens.filter(m => m.remetente === "cliente").slice(-1).length
    : 0;
};

export const ConversationItem = React.memo(({ atendimento, isSelected, onSelect }: ConversationItemProps) => {
  const lastMsg = getLastMessage(atendimento);
  const unread = getUnreadCount(atendimento);
  const lastTime = atendimento.mensagens.length > 0
    ? atendimento.mensagens[atendimento.mensagens.length - 1].timestamp
    : atendimento.criadoEm;

  return (
    <div
      onClick={() => onSelect(atendimento)}
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
          {(atendimento.clienteNome || "??").substring(0, 2).toUpperCase()}
        </div>
        {atendimento.metadata?.status && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        )}
        {atendimento.status !== "resolvido" && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
            atendimento.status === "aberto" ? "bg-yellow-500" : "bg-blue-500"
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sm text-foreground truncate">
              {atendimento.clienteNome}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] uppercase font-bold shrink-0 ${priorityColors[atendimento.prioridade] || priorityColors.media}`}>
                {atendimento.prioridade}
              </Badge>
              <span className={`text-[10px] font-medium shrink-0 ${statusConfig[atendimento.status]?.color}`}>
                {statusConfig[atendimento.status]?.label}
              </span>
            </div>
          </div>
          <span className={`text-[11px] shrink-0 ml-2 ${
            unread > 0 ? "text-primary font-medium" : "text-muted-foreground"
          }`}>
            {formatTime(lastTime)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-muted-foreground truncate pr-2 flex items-center gap-1">
            {atendimento.mensagens.length > 0 && atendimento.mensagens[atendimento.mensagens.length - 1].remetente === "atendente" && (
              <CheckCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            {lastMsg}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {atendimento.origem && (
              <span className="text-[10px]">{origemIcons[atendimento.origem] || ""}</span>
            )}
            {unread > 0 && (
              <span className="w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = "ConversationItem";
