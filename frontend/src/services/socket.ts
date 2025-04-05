// /frontend/src/services/socket.ts

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket) return socket; // 이미 생성된 소켓이 있다면 그대로 반환

  const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;
  socket = io(SOCKET_SERVER_URL, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("WebSocket 서버에 연결되었습니다. Socket ID:", socket!.id);
  });

  // 필요한 경우 추가 이벤트 핸들러 등록
  // ...

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
