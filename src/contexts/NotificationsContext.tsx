import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Notification types
export type NotificationType = "success" | "warning" | "info" | "alert" | "lead" | "financial" | "webhook" | "client" | "appointment";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string; // Optional link to navigate to
  metadata?: Record<string, any>; // Extra data for the notification
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  clearReadNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Initial mock notifications is now empty to start fresh with real data
const initialNotifications: Notification[] = [];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem("app_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // CRITICAL: Block mock data from loading
        const hasMockData = parsed.some((n: any) =>
          (n.title && (n.title.includes("Ana Paula") || n.title.includes("João Silva"))) ||
          (n.message && (n.message.includes("Ana Paula") || n.message.includes("João Silva")))
        );

        if (hasMockData) {
          console.warn("Legacy mock data detected, purging storage.");
          localStorage.removeItem("app_notifications");
          return [];
        }

        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      } catch {
        return initialNotifications;
      }
    }
    return initialNotifications;
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // One-time mount cleanup to guarantee no mock data survives
  useEffect(() => {
    setNotifications(prev => {
      const isMock = prev.some(n =>
        (n.title && (n.title.includes("Ana Paula") || n.title.includes("João Silva")))
      );
      if (isMock) return [];
      return prev;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);

      // Also show high-level toast
      toast.info(newNotification.title, {
        description: newNotification.message,
      });
    },
    []
  );

  // Real-time integration for various tables that generate notifications
  useEffect(() => {
    const leadsChannel = supabase
      .channel('leads-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        addNotification({
          type: "lead",
          title: "Novo Lead Detectado",
          message: `${payload.new.name} entrou via ${payload.new.source || 'WhatsApp'}`,
          link: "/leads",
        });
      })
      .subscribe();

    const appointmentsChannel = supabase
      .channel('appointments-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agendamentos' }, (payload) => {
        addNotification({
          type: "appointment",
          title: "Novo Agendamento",
          message: `${payload.new.cliente_nome} agendou para ${payload.new.horario}`,
          link: "/agenda",
        });
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        // Only notify if msg is from client
        if (payload.new.remetente === 'cliente') {
          addNotification({
            type: "info",
            title: "Mensagem Recebida",
            message: payload.new.texto.substring(0, 50) + (payload.new.texto.length > 50 ? '...' : ''),
            link: "/atendimentos",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        clearReadNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}

// Helper function to format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Agora";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Há ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Há ${hours} hora${hours > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Há ${days} dia${days > 1 ? "s" : ""}`;
  } else {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  }
}
