import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

export function SystemClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "short",
    }).replace(".", "");
  };

  return (
    <div className="flex items-center gap-5 px-5 py-2 rounded-lg bg-secondary/30 border border-border/50 group hover:border-primary/40 transition-all duration-300">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <p className="text-2xl font-mono font-semibold text-foreground tabular-nums tracking-tight">
            {formatTime(time)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <Calendar className="w-3 h-3" />
          <p className="text-[11px] font-medium uppercase tracking-[0.1em]">
            {formatDate(time)}
          </p>
        </div>
      </div>
      <div className="h-10 w-[1px] bg-border/50" />
      <div className="flex flex-col items-start">
        <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1.5">
          System
        </p>
        <div className="flex items-center gap-1.5 text-foreground/80">
          <Clock className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          <span className="text-xs font-bold">SP/BR</span>
        </div>
      </div>
    </div>
  );
}


