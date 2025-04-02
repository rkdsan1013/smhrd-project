import { get, post } from "./apiClient";

// 친구 목록
export interface Friend {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  status: "accepted" | "pending" | "blocked";
}

// 검색 결과
export interface SearchResultUser {
  uuid: string;
  name: string;
  email: string;
  profilePicture?: string;
  friendStatus?: "pending" | "accepted" | null;
}

// ✅ 친구 목록 가져오기
export const fetchFriendList = async (): Promise<Friend[]> => {
  const res = await get<{ success: boolean; friends: Friend[] }>("/friends");
  return res.friends;
};

// ✅ POST 방식으로 친구 검색하기
export const searchUsers = async (keyword: string): Promise<SearchResultUser[]> => {
  const res = await post<{ success: boolean; users: SearchResultUser[] }>("/friends/search", {
    keyword,
  });
  return res.users;
};

// ✅ 친구 요청 보내기
export const sendFriendRequest = async (targetUuid: string): Promise<void> => {
  await post("/friends", { targetUuid });
};
