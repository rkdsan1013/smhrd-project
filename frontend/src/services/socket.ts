// /frontend/src/services/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL as string;

const socket: Socket = io(SOCKET_SERVER_URL, {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("WebSocket 서버에 연결되었습니다. Socket ID:", socket.id);
});

export default socket;
