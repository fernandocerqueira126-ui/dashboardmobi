import { Phone, Mail, DollarSign, Calendar, MessageCircle, Instagram } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  name: string;
  phone?: string;
  email?: string;
  value?: string;
  paidValue?: string;
  description?: string;
  date?: string;
  source?: string;
  isPaid?: boolean;
  tags?: string[];
}

export function LeadCard({
  name,
  phone,
  email,
  value,
  paidValue,
  description,
  date,
  source,
  isPaid = false,
  tags = [],
}: LeadCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="lead-card space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <MessageCircle className="w-3.5 h-3.5 text-success" />
            <Instagram className="w-3.5 h-3.5 text-pink-400" />
          </div>
        </div>
      </div>

      {phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{phone}</span>
        </div>
      )}

      {email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span className="truncate">{email}</span>
        </div>
      )}

      {value && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-warning" />
          <span className="text-warning font-medium">{value} estimado</span>
        </div>
      )}

      {paidValue && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-success" />
          <span className="text-success font-medium">{paidValue} pago</span>
        </div>
      )}

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}

      {date && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {isPaid && (
          <span className="badge-status badge-paid">Pago</span>
        )}
        {source && (
          <span className="badge-status bg-purple-500/20 text-purple-400">{source}</span>
        )}
        {tags.map((tag) => (
          <span key={tag} className="badge-status bg-secondary text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
