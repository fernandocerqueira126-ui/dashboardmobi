import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

type StatVariant = "default" | "featured" | "mini";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: StatVariant;
  iconColor?: "blue" | "green" | "orange" | "red" | "purple" | "yellow" | "pink" | "teal";
  trend?: {
    value: number;
    positive: boolean;
  };
  isLoading?: boolean;
  chartData?: { value: number }[];
}

const iconColorClasses = {
  blue: "stat-icon-blue",
  green: "stat-icon-green",
  orange: "stat-icon-orange",
  red: "stat-icon-red",
  purple: "stat-icon-purple",
  yellow: "stat-icon-yellow",
  pink: "stat-icon-pink",
  teal: "stat-icon-teal",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  iconColor = "blue",
  trend,
  isLoading = false,
  chartData,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className={cn(
        "relative overflow-hidden bg-card rounded-2xl border border-border/40 animate-pulse",
        variant === "featured" ? "p-6 h-[160px]" : "p-4 h-[120px]"
      )}>
        <div className="flex justify-between items-start">
          <div className="w-24 h-4 bg-secondary rounded" />
          <div className="w-8 h-8 bg-secondary rounded-lg" />
        </div>
        <div className="mt-4 w-32 h-8 bg-secondary rounded" />
        <div className="mt-2 w-48 h-3 bg-secondary rounded opacity-50" />
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="relative overflow-hidden bg-card rounded-2xl p-6 border border-primary/20 shadow-2xl shadow-primary/5 group transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 flex flex-col justify-between h-full">
        {/* Efeito de luz sutil no fundo */}
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            {Icon && (
              <div className={cn("p-2 rounded-lg bg-primary/10", iconColor && `text-crm-${iconColor}`)}>
                <Icon className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3 mt-4">
            <h2 className="text-4xl font-bold text-foreground tracking-tight">{value}</h2>
            {trend && (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {trend.positive ? "↑" : "↓"} {trend.value}%
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-sm text-primary/80 mt-2 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {subtitle}
            </p>
          )}
        </div>

        {/* Gráfico Minimalista de Fundo */}
        {chartData && (
          <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${iconColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--crm-${iconColor || 'blue'})`} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={`var(--crm-${iconColor || 'blue'})`} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={`hsl(var(--crm-${iconColor || 'blue'}))`}
                  fillOpacity={1}
                  fill={`url(#gradient-${iconColor})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }

  if (variant === "mini") {
    return (
      <div className="bg-card/40 backdrop-blur-sm rounded-xl p-3 border border-border/40 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("p-1.5 rounded-lg", iconColorClasses[iconColor])}>
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{title}</p>
            <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-metric animate-fade-in group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={cn("stat-icon group-hover:scale-110 transition-transform duration-300", iconColorClasses[iconColor])}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/50",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            {trend.positive ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-primary/70 mt-1 italic">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
