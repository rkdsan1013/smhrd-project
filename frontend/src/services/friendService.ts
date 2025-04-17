// /frontend/src/services/friendService.ts

import { get, post, patch, remove } from "./apiClient";

// 친구 목록 인터페이스
export interface Friend {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  status: "accepted" | "pending";
}

// 친구 요청 목록 인터페이스
export interface ReceivedFriendRequest {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
}

// 사용자 검색 결과 인터페이스
export interface SearchResultUser {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  friendStatus?: "pending" | "accepted" | null;
  friendRequester?: string;
}

// 친구 목록 가져오기 API 함수
export const fetchFriendList = async (): Promise<Friend[]> => {
  const res = await get<{ success: boolean; friends: Friend[] }>("/friends");
  return res.friends;
};

// 친구 검색 API 함수 (POST 방식)
export const searchUsers = async (keyword: string): Promise<SearchResultUser[]> => {
  const res = await post<{ success: boolean; users: SearchResultUser[] }>("/friends/search", {
    keyword,
  });
  return res.users;
};

// 친구 요청 보내기 API 함수
export const sendFriendRequest = async (targetUuid: string): Promise<void> => {
  await post("/friends", { targetUuid });
};

// 친구 요청 취소하기 API 함수 (요청 보낸 사람이 직접 취소)
export const cancelFriendRequest = async (targetUuid: string): Promise<void> => {
  await remove(`/friends/${targetUuid}/cancel`);
};

// 받은 친구 요청 목록 가져오기 API 함수
export const fetchReceivedFriendRequests = async (): Promise<ReceivedFriendRequest[]> => {
  const res = await get<{ success: boolean; requests: ReceivedFriendRequest[] }>(
    "/friends/received",
  );
  return res.requests;
};

// 친구 요청 수락하기 API 함수
export const acceptFriendRequest = async (uuid: string): Promise<void> => {
  await patch(`/friends/${uuid}/accept`);
};

// 친구 요청 거절하기 API 함수
export const declineFriendRequest = async (uuid: string): Promise<void> => {
  await remove(`/friends/${uuid}/decline`);
};

// 친구 삭제 API 함수
export const deleteFriend = async (targetUuid: string): Promise<void> => {
  await remove(`/friends/${targetUuid}`);
};
