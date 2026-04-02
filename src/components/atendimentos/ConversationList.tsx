import React from "react";
import { Atendimento } from "@/contexts/AtendimentosContext";
import { ConversationItem } from "./ConversationItem";

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

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  MessageSquare,
} from "lucide-react";

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
  // Sorting: Pending first, then by last message date
  const sortedAtendimentos = React.useMemo(() => {
    return [...atendimentos].sort((a, b) => {
      const aUnread = a.mensagens.filter(m => m.remetente === "cliente").length > 0 && a.status !== "resolvido";
      const bUnread = b.mensagens.filter(m => m.remetente === "cliente").length > 0 && b.status !== "resolvido";
      
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      const aTime = a.mensagens.length > 0 
        ? a.mensagens[a.mensagens.length - 1].timestamp.getTime() 
        : a.criadoEm.getTime();
      const bTime = b.mensagens.length > 0 
        ? b.mensagens[b.mensagens.length - 1].timestamp.getTime() 
        : b.criadoEm.getTime();
      
      return bTime - aTime;
    });
  }, [atendimentos]);

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
            {sortedAtendimentos.map((atd) => (
              <ConversationItem
                key={atd.id}
                atendimento={atd}
                isSelected={selectedId === atd.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
