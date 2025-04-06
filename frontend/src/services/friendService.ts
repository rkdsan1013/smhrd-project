// /frontend/src/services/friendService.ts

import { get, post, patch, remove } from "./apiClient";

// 친구 목록
export interface Friend {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  status: "accepted" | "pending";
}

// 친구 요청 목록
export interface ReceivedFriendRequest {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
}

// 검색 결과

export interface SearchResultUser {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  friendStatus?: "pending" | "accepted" | null;
  friendRequester?: string;
}

// 친구 목록 가져오기
export const fetchFriendList = async (): Promise<Friend[]> => {
  const res = await get<{ success: boolean; friends: Friend[] }>("/friends");
  return res.friends;
};

// POST 방식으로 친구 검색하기
export const searchUsers = async (keyword: string): Promise<SearchResultUser[]> => {
  const res = await post<{ success: boolean; users: SearchResultUser[] }>("/friends/search", {
    keyword,
  });
  return res.users;
};

// 친구 요청 보내기
export const sendFriendRequest = async (targetUuid: string): Promise<void> => {
  await post("/friends", { targetUuid });
};

// 친구 요청 취소하기 (요청 보낸 사람이 직접 요청을 취소)
export const cancelFriendRequest = async (targetUuid: string): Promise<void> => {
  await remove(`/friends/${targetUuid}/cancel`);
};

// 친구 요청 목록 가져오기
export const fetchReceivedFriendRequests = async (): Promise<ReceivedFriendRequest[]> => {
  const res = await get<{ success: boolean; requests: ReceivedFriendRequest[] }>(
    "/friends/received",
  );
  return res.requests;
};

// 친구 요청 수락하기
export const acceptFriendRequest = async (uuid: string) => {
  await patch(`/friends/${uuid}/accept`);
};

// 친구 요청 거절하기
export const declineFriendRequest = async (uuid: string) => {
  await remove(`/friends/${uuid}/decline`);
};

// 친구 삭제
export const deleteFriend = async (targetUuid: string): Promise<void> => {
  await remove(`/friends/${targetUuid}`);
};
