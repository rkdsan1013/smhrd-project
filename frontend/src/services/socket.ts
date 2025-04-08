import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket) return socket;

  const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;
  socket = io(SOCKET_SERVER_URL, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("WebSocket 서버에 연결되었습니다. Socket ID:", socket!.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("WebSocket 연결이 끊어졌습니다. Reason:", reason);
  });
  socket.on("connect_error", (error) => {
    console.error("WebSocket 연결 에러:", error);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
