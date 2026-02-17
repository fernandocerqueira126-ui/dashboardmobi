import { Bell, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, formatRelativeTime, NotificationType } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  UserPlus,
  Users,
  Webhook,
  ExternalLink,
  Clock,
} from "lucide-react";
import { SystemClock } from "./SystemClock";

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

// Icon mapping for notification types
const typeIcons: Record<NotificationType, any> = {
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
  alert: AlertCircle,
  lead: UserPlus,
  financial: DollarSign,
  webhook: Webhook,
  client: Users,
  appointment: Calendar,
};

const typeColors: Record<NotificationType, string> = {
  success: "text-green-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
  alert: "text-red-500",
  lead: "text-purple-500",
  financial: "text-green-500",
  webhook: "text-blue-500",
  client: "text-purple-500",
  appointment: "text-yellow-500",
};

export function Header({ title, subtitle, icon }: HeaderProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SystemClock />
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notificações</h4>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => markAllAsRead()}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[300px]">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type];
                    const iconColor = typeColors[notification.type];
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-secondary/50 transition-colors",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm",
                              notification.read ? "text-muted-foreground" : "text-foreground font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatRelativeTime(notification.timestamp)}
                              </span>
                              {notification.link && (
                                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <div className="p-2 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full text-sm h-8"
                onClick={() => navigate("/notificacoes")}
              >
                Ver todas as notificações
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">admin@crm.com</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
