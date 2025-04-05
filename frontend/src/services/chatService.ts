import { get, post } from "./apiClient";
import { Socket } from "socket.io-client";

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

// 메시지 전송 (웹소켓 사용) - socket을 인자로 받음
export const sendMessageSocket = (socket: Socket, roomUuid: string, message: string) => {
  socket.emit("sendMessage", { roomUuid, message });
};

// 채팅방 참여 (웹소켓 사용) - socket을 인자로 받음
export const joinChatRoom = (socket: Socket, roomUuid: string) => {
  socket.emit("joinRoom", roomUuid);
};

// 채팅 메시지 조회
export const fetchMessagesByRoom = async (roomUuid: string): Promise<ChatMessage[]> => {
  const res = await get<{ success: boolean; messages: ChatMessage[] }>(
    `/chats/${roomUuid}/messages`,
  );
  return res.messages;
};
