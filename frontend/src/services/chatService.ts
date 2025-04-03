// /frontend/src/services/chatService.ts
import { post } from "./apiClient";

// DM 채팅방 생성 또는 조회
export const openOrCreateDMRoom = async (targetUuid: string) => {
  const res = await post<{ success: boolean; roomUuid: string }>("/chats/dm", { targetUuid });
  return res.roomUuid;
};
