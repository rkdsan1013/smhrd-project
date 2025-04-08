// /frontend/src/services/chatService.ts

import { get, post } from "./apiClient";
import { Socket } from "socket.io-client";

// 채팅 메시지 인터페이스
export interface ChatMessage {
  uuid: string;
  room_uuid: string;
  sender_uuid: string;
  sender_name: string;
  sender_picture?: string;
  message: string;
  sent_at: string;
}

// DM 채팅방 생성 또는 조회 API 호출
export const openOrCreateDMRoom = async (friendUuid: string): Promise<string> => {
  const res = await post<{ success: boolean; roomUuid: string }>("/chats/dm", { friendUuid });
  return res.roomUuid;
};

// 웹소켓을 통해 메시지 전송
export const sendMessageSocket = (socket: Socket, roomUuid: string, message: string): void => {
  socket.emit("sendMessage", { roomUuid, message });
};

// 웹소켓을 통해 채팅방 참여
export const joinChatRoom = (socket: Socket, roomUuid: string): void => {
  socket.emit("joinRoom", roomUuid);
};

// 채팅방의 메시지 조회 API 호출
export const fetchMessagesByRoom = async (roomUuid: string): Promise<ChatMessage[]> => {
  const res = await get<{ success: boolean; messages: ChatMessage[] }>(
    `/chats/${roomUuid}/messages`,
  );
  return res.messages;
};
