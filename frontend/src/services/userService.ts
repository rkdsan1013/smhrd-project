// /frontend/src/services/userService.ts

import { get, patch } from "./apiClient";
import { UserProfile } from "../hooks/useUserProfile";

// 유저 프로필 조회 API 함수
export const fetchUserProfile = () =>
  get<{ success: boolean; profile: UserProfile }>("/users/profile");

// 프로필 수정 API 함수 (이름과 프로필 사진(FormData) 전송)
export const updateUserProfile = (formData: FormData) =>
  patch<{ success: boolean; profile: UserProfile }>("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// uuid를 기반으로 상대방 프로필 + 친구 상태 정보 가져오기
export const getUserProfileWithStatus = async (uuid: string) => {
  const res = await get<{ success: boolean; profile: any }>(`/users/profile-with-status/${uuid}`);
  return res.profile;
};
