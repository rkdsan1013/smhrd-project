// /frontend/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // 환경변수에서 소켓 서버 URL 가져오기
    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;
    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected, Socket ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(newSocket);

    // 컴포넌트 언마운트 시 소켓 연결 종료
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
