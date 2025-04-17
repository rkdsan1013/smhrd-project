// /frontend/src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSocket } from "./SocketContext";
import { getReceivedGroupInvites } from "../services/groupService";

export type Notification =
  | {
      type: "groupInvite";
      id: string;
      sender: string;
      groupName: string;
    }
  | {
      type: "chatMessage";
      id: number;
      sender: string;
      message: string;
      chatId: number;
    }
  | {
      type: "friendRequest";
      id: number;
      sender: string;
    };

interface NotificationContextType {
  notifications: Notification[];
  acceptNotification: (id: string | number, type: Notification["type"]) => void;
  declineNotification: (id: string | number, type: Notification["type"]) => void;
  removeNotification: (id: string | number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadInitialGroupInvites = async () => {
      try {
        const invites = await getReceivedGroupInvites();

        setNotifications((prev) => {
          const combined = [...prev];
          for (const invite of invites) {
            const exists = combined.some(
              (n) => n.type === "groupInvite" && n.id === invite.inviteUuid,
            );
            if (!exists) {
              combined.push({
                type: "groupInvite",
                id: invite.inviteUuid,
                sender: invite.inviterName,
                groupName: invite.groupName,
              });
            }
          }
          return combined;
        });
      } catch (err) {
        console.error("초기 그룹 초대 알림 로딩 실패:", err);
      }
    };

    loadInitialGroupInvites();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.type === notification.type && n.id === notification.id);
        return exists ? prev : [...prev, notification];
      });
    };

    const handleInviteCancelled = ({ inviteUuid }: { inviteUuid: string }) => {
      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            !(notification.type === "groupInvite" && notification.id === inviteUuid),
        ),
      );
    };

    socket.on("notification", handleNotification);
    socket.on("group-invite", handleNotification); // 소켓 실시간 알림
    socket.on("groupInviteCancelled", handleInviteCancelled);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("group-invite", handleNotification);
      socket.off("groupInviteCancelled", handleInviteCancelled);
    };
  }, [socket]);

  const acceptNotification = (id: string | number, type: Notification["type"]) => {
    if (type === "groupInvite" || type === "friendRequest") {
      socket?.emit("notificationResponse", { id, type, response: "accepted" });
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const declineNotification = (id: string | number, type: Notification["type"]) => {
    if (type === "groupInvite" || type === "friendRequest") {
      socket?.emit("notificationResponse", { id, type, response: "declined" });
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const removeNotification = (id: string | number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, acceptNotification, declineNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
