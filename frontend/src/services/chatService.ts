// /frontend/src/services/chatService.ts
import { get, post } from "./apiClient";
import socket from "./socket";

export interface ChatMessage {
  uuid: string;
  room_uuid: string;
  sender_uuid: string;
  message: string;
  sent_at: string;
}

// DM 채팅방 생성 또는 조회
export const openOrCreateDMRoom = async (friendUuid: string) => {
  const res = await post<{ success: boolean; roomUuid: string }>("/chats/dm", { friendUuid }); // ✅ 키 이름 일치
  return res.roomUuid;
};

export const sendMessageSocket = (roomUuid: string, message: string) => {
  socket.emit("sendMessage", { roomUuid, message });
};

export const joinChatRoom = (roomUuid: string) => {
  socket.emit("joinRoom", roomUuid);
};

export const fetchMessagesByRoom = async (roomUuid: string): Promise<ChatMessage[]> => {
  const res = await get<{ success: boolean; messages: ChatMessage[] }>(
    `/chats/${roomUuid}/messages`,
  );
  return res.messages;
};
