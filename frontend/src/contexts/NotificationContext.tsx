// File: /frontend/src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSocket } from "./SocketContext";

export type Notification =
  | {
      type: "groupInvite";
      id: string; // 그룹 초대의 id (UUID 문자열)
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
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      console.log("Received notification via socket:", notification);
      setNotifications((prev) => [...prev, notification]);
    };

    socket.on("notification", handleNotification);
    socket.on("group-invite", handleNotification); // 추가: group-invite 이벤트도 수신

    // 기존 groupInviteCancelled 이벤트 등록 등 ...

    return () => {
      socket.off("notification", handleNotification);
      socket.off("group-invite", handleNotification);
      // 나머지 이벤트 제거
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
