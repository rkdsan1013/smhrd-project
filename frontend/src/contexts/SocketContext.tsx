// /frontend/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
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
    // 새로운 소켓 인스턴스 생성
    const newSocket = io(SOCKET_SERVER_URL, { withCredentials: true });

    // 기본 이벤트 핸들러 등록
    newSocket.on("connect", () => {
      console.log("Socket connected, Socket ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // 필요에 따라 추가 이벤트 처리도 이곳에 구현할 수 있습니다.
    // 예: newSocket.on("message", (data) => { ... });

    setSocket(newSocket);

    // cleanup 함수: 컴포넌트 언마운트 또는 재실행 시 소켓 연결 종료
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []); // 빈 의존성 배열로 앱 실행 시 한 번만 실행

  const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => useContext(SocketContext);
