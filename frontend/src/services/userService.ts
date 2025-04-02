// /frontend/src/services/userService.ts
import { get } from "./apiClient";
import { UserProfile } from "../hooks/useUserProfile";

// 유저 프로필 조회 API 함수
export const fetchUserProfile = () => {
  return get<{ success: boolean; profile: UserProfile }>("/users/profile");
};
