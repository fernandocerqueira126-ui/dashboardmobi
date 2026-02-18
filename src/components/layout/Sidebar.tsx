import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCircle,
  UsersRound,
  Headphones,
  DollarSign,
  BarChart3,
  Zap,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";

const menuGroups = [
  {
    title: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ]
  },
  {
    title: "Gestão",
    items: [
      { icon: Users, label: "Leads CRM", path: "/leads" },
      { icon: Calendar, label: "Visitas Agendadas", path: "/agenda" },
      { icon: Headphones, label: "Atendimentos", path: "/atendimentos" },
    ]
  },
  {
    title: "Administrativo",
    items: [
      { icon: UserCircle, label: "Proprietários", path: "/clientes" },
      { icon: UsersRound, label: "Corretores", path: "/colaboradores" },
      { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
    ]
  },
  {
    title: "Sistema",
    items: [
      { icon: Zap, label: "Automação", path: "/automacao" },
      { icon: Bell, label: "Notificações", path: "/notificacoes", showBadge: true },
    ]
  }
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { user, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-foreground">Imobiliária Pro</span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="input-search w-full pl-9 h-9"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                const showBadge = item.showBadge && unreadCount > 0;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "sidebar-item relative group",
                      isActive && "sidebar-item-active"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                      )} />
                      {showBadge && collapsed && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-sidebar">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        {showBadge && (
                          <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] text-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                    {isActive && !collapsed && (
                      <div className="absolute left-0 w-1 h-5 bg-primary-foreground rounded-r-full" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {role === 'admin' ? 'Administrador' : 'Corretor'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-sidebar-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
