import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  User,
  Trash2,
  Check,
  MoreVertical,
  Search,
  Filter,
  Webhook,
  UserPlus,
  Users,
  ExternalLink,
  Eye,
  XCircle,
  CheckCheck,
  Inbox,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useNotifications, 
  formatRelativeTime, 
  NotificationType 
} from "@/contexts/NotificationsContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Icon and color mapping for notification types
const typeConfig: Record<NotificationType, { icon: any; color: string; label: string }> = {
  success: { icon: CheckCircle, color: "stat-icon-green", label: "Sucesso" },
  warning: { icon: AlertCircle, color: "stat-icon-yellow", label: "Aviso" },
  info: { icon: Info, color: "stat-icon-blue", label: "Info" },
  alert: { icon: AlertCircle, color: "stat-icon-red", label: "Alerta" },
  lead: { icon: UserPlus, color: "stat-icon-purple", label: "Lead" },
  financial: { icon: DollarSign, color: "stat-icon-green", label: "Financeiro" },
  webhook: { icon: Webhook, color: "stat-icon-blue", label: "Webhook" },
  client: { icon: Users, color: "stat-icon-purple", label: "Cliente" },
  appointment: { icon: Calendar, color: "stat-icon-yellow", label: "Agendamento" },
};

export default function Notificacoes() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    clearReadNotifications,
  } = useNotifications();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Dialogs
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearMode, setClearMode] = useState<"all" | "read">("all");

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || notification.type === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "unread" && !notification.read) ||
        (filterStatus === "read" && notification.read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    
    filteredNotifications.forEach((notification) => {
      const date = notification.timestamp;
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let groupKey: string;
      if (diffInDays === 0) {
        groupKey = "Hoje";
      } else if (diffInDays === 1) {
        groupKey = "Ontem";
      } else if (diffInDays < 7) {
        groupKey = "Esta semana";
      } else if (diffInDays < 30) {
        groupKey = "Este mês";
      } else {
        groupKey = "Anteriores";
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  }, [filteredNotifications]);

  // Handle notification click
  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Handle clear notifications
  const handleClearNotifications = () => {
    if (clearMode === "all") {
      clearAllNotifications();
      toast.success("Todas as notificações foram removidas");
    } else {
      clearReadNotifications();
      toast.success("Notificações lidas foram removidas");
    }
    setIsClearDialogOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success("Todas as notificações foram marcadas como lidas");
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Notificações"
        subtitle="Fique por dentro de tudo que acontece"
        icon={<Bell className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-metric p-4 flex items-center gap-3">
            <div className="stat-icon stat-icon-blue">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="card-metric p-4 flex items-center gap-3">
            <div className="stat-icon stat-icon-yellow">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Não lidas</p>
            </div>
          </div>
          <div className="card-metric p-4 flex items-center gap-3">
            <div className="stat-icon stat-icon-green">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{notifications.length - unreadCount}</p>
              <p className="text-xs text-muted-foreground">Lidas</p>
            </div>
          </div>
          <div className="card-metric p-4 flex items-center gap-3">
            <div className="stat-icon stat-icon-purple">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {notifications.filter(n => n.type === "webhook").length}
              </p>
              <p className="text-xs text-muted-foreground">Webhooks</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="webhook">Webhooks</SelectItem>
                <SelectItem value="appointment">Agendamentos</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="alert">Alertas</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4" />
              Marcar todas como lidas
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {
                    setClearMode("read");
                    setIsClearDialogOpen(true);
                  }}
                  disabled={notifications.length - unreadCount === 0}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Limpar lidas
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setClearMode("all");
                    setIsClearDialogOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="card-metric flex flex-col items-center justify-center py-16">
            <div className="stat-icon stat-icon-blue mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {notifications.length === 0 
                ? "Nenhuma notificação" 
                : "Nenhum resultado encontrado"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {notifications.length === 0
                ? "Quando houver atividade no sistema (leads, transações, webhooks), as notificações aparecerão aqui."
                : "Tente ajustar os filtros para encontrar o que procura."}
            </p>
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
              <div key={groupName}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <span>{groupName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {groupNotifications.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {groupNotifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "card-metric flex items-start gap-4 cursor-pointer transition-all hover:shadow-md group",
                          !notification.read && "border-l-2 border-l-primary bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={cn("stat-icon flex-shrink-0", config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={cn(
                                  "font-medium",
                                  notification.read ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {notification.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                {notification.link && (
                                  <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-3 h-3" />
                                    Ver detalhes
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(notification.timestamp, "HH:mm", { locale: ptBR })}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.read && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                      toast.success("Marcada como lida");
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Marcar como lida
                                    </DropdownMenuItem>
                                  )}
                                  {notification.link && (
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(notification.link!);
                                    }}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Ir para página
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                      toast.success("Notificação removida");
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearMode === "all" ? "Limpar todas as notificações" : "Limpar notificações lidas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearMode === "all"
                ? "Tem certeza que deseja remover todas as notificações? Esta ação não pode ser desfeita."
                : "Tem certeza que deseja remover todas as notificações já lidas? As não lidas serão mantidas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearNotifications}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
