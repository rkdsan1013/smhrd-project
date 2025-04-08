// /frontend/src/services/socket.ts

import { io, Socket } from "socket.io-client";

// 소켓 서버 URL 상수로 분리
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;

let socket: Socket | null = null;

// 소켓 초기화 후 싱글턴 인스턴스 반환
export const initializeSocket = (): Socket => {
  if (socket) return socket;

  // Socket.io 클라이언트 초기화
  socket = io(SOCKET_SERVER_URL, { withCredentials: true });

  socket.on("connect", () => {
    console.log("WebSocket 서버에 연결되었습니다. Socket ID:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("WebSocket 연결이 끊어졌습니다. Reason:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket 연결 에러:", error);
  });

  return socket;
};

// 현재 연결된 socket 종료 후 인스턴스 초기화
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
