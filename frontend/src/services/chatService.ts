import { get, post } from "./apiClient";
import socket from "./socket";

export interface ChatMessage {
  uuid: string;
  room_uuid: string;
  sender_uuid: string;
  sender_name: string;
  sender_picture?: string;
  message: string;
  sent_at: string;
}

// DM 채팅방 생성 또는 조회
export const openOrCreateDMRoom = async (friendUuid: string) => {
  const res = await post<{ success: boolean; roomUuid: string }>("/chats/dm", { friendUuid });
  return res.roomUuid;
};

// 메시지 전송 (웹소켓)
export const sendMessageSocket = (roomUuid: string, message: string) => {
  socket.emit("sendMessage", { roomUuid, message });
};

// 채팅방 참여
export const joinChatRoom = (roomUuid: string) => {
  socket.emit("joinRoom", roomUuid);
};

// 메시지 가져오기
export const fetchMessagesByRoom = async (roomUuid: string): Promise<ChatMessage[]> => {
  const res = await get<{ success: boolean; messages: ChatMessage[] }>(
    `/chats/${roomUuid}/messages`,
  );
  return res.messages;
};
