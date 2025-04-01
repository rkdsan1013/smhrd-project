// /frontend/src/services/userService.ts
import { get, post } from "./apiClient";
import { IUserProfile } from "../hooks/useUserProfile";

// 친구 목록 조회 응답 인터페이스
export interface FriendsResponse {
  friends: { uuid: string; name: string }[];
}

// 친구 목록 조회
export const fetchFriends = async (uuid: string): Promise<FriendsResponse> => {
  return get<FriendsResponse>(`/users/friends/${uuid}`, { withCredentials: true });
};

// 친구 정보 조회
export const fetchFriendProfile = async (
  friendUuid: string,
): Promise<{ profile: IUserProfile }> => {
  return get<{ profile: IUserProfile }>(`/users/${friendUuid}`, { withCredentials: true });
};
