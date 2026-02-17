import { cn } from "@/lib/utils";
import { Plus, TrendingUp } from "lucide-react";
import { LeadCard } from "./LeadCard";

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  value?: string;
  paidValue?: string;
  description?: string;
  date?: string;
  source?: string;
  isPaid?: boolean;
}

interface KanbanColumnProps {
  title: string;
  color: "blue" | "orange" | "purple" | "yellow" | "green" | "red";
  leads: Lead[];
  estimated?: string;
  invoiced?: string;
  paid?: number;
  conversion?: number;
  conversionGoal?: number;
}

const colorClasses = {
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

const progressColors = {
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

export function KanbanColumn({
  title,
  color,
  leads,
  estimated = "R$ 0",
  invoiced = "R$ 0",
  paid = 0,
  conversion = 0,
  conversionGoal = 25,
}: KanbanColumnProps) {
  return (
    <div className="kanban-column flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("w-2 h-2 rounded-full", colorClasses[color])} />
        <h3 className="font-medium text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
          {leads.length}
        </span>
        {leads.length > 0 && (
          <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded ml-auto">
            ${leads.length}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-primary font-medium">{estimated}</p>
          <p className="text-[10px] text-muted-foreground">Estimado</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-foreground font-medium">{invoiced}</p>
          <p className="text-[10px] text-muted-foreground">Faturado</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-foreground font-medium">{paid}</p>
          <p className="text-[10px] text-muted-foreground">Pagos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Conversão</span>
          <span className="text-foreground">{conversion}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={cn("progress-fill", progressColors[color])}
            style={{ width: `${Math.min(conversion, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Meta: {conversionGoal}% conversão
        </p>
      </div>

      {/* Leads */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {leads.length > 0 ? (
          leads.map((lead) => <LeadCard key={lead.id} {...lead} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Vazio</p>
            <p className="text-xs">Arraste leads aqui ou crie um novo</p>
          </div>
        )}
      </div>
    </div>
  );
}
