// /frontend/src/services/userService.ts

import { get, patch } from "./apiClient";
import { UserProfile } from "../hooks/useUserProfile";

// 유저 프로필 조회 API 함수
export const fetchUserProfile = () => {
  return get<{ success: boolean; profile: UserProfile }>("/users/profile");
};

// 프로필 수정 API 함수: 이름과 프로필 사진(FormData) 전송
export const updateUserProfile = (formData: FormData) => {
  return patch<{ success: boolean; profile: UserProfile }>("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
