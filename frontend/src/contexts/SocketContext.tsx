// /frontend/src/contexts/SocketContext.tsx

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;
    const newSocket = io(SOCKET_SERVER_URL, { withCredentials: true });

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

  // 컨텍스트 값을 메모이제이션하여 불필요한 리렌더링 방지
  const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => useContext(SocketContext);
