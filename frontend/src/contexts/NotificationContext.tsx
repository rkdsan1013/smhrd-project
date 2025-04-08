// /frontend/src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSocket } from "./SocketContext";

// 여러 종류의 알림을 discriminated union 타입으로 정의합니다.
export type Notification =
  | {
      type: "groupInvite";
      id: number;
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
  acceptNotification: (id: number, type: Notification["type"]) => void;
  declineNotification: (id: number, type: Notification["type"]) => void;
  removeNotification: (id: number) => void;
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

  const [notifications, setNotifications] = useState<Notification[]>([
    // 초기 예시 데이터 – 실제 서비스에서는 서버로부터 받은 데이터로 대체합니다.
    { type: "groupInvite", id: 1, sender: "Alice", groupName: "Study Group" },
    { type: "chatMessage", id: 2, sender: "Bob", message: "Hello!", chatId: 101 },
    { type: "friendRequest", id: 3, sender: "Charlie" },
  ]);

  // 소켓을 통해 실시간 알림 수신
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      console.log("Received notification via socket:", notification);
      setNotifications((prev) => [...prev, notification]);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  // 알림 응답(수락/거절) 시 서버로 응답 전송 후 상태 갱신
  const acceptNotification = (id: number, type: Notification["type"]) => {
    if (type === "groupInvite" || type === "friendRequest") {
      console.log(`Accepted ${type} with id: ${id}`);
      socket?.emit("notificationResponse", { id, type, response: "accepted" });
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const declineNotification = (id: number, type: Notification["type"]) => {
    if (type === "groupInvite" || type === "friendRequest") {
      console.log(`Declined ${type} with id: ${id}`);
      socket?.emit("notificationResponse", { id, type, response: "declined" });
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // 예를 들어, chatMessage 알림은 단순히 제거 처리
  const removeNotification = (id: number) => {
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
