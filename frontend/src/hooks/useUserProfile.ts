// /frontend/src/hooks/useUserProfile.ts
import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import { useUser } from "../contexts/UserContext";

// 사용자 프로필 인터페이스
export interface IUserProfile {
  uuid: string;
  email: string;
  name: string;
  profile_picture?: string;
  birthdate?: string;
  gender?: string;
}

// 자신의 프로필 정보를 가져오는 훅 (전체 정보 반환)
export const useUserProfile = () => {
  const { userUuid } = useUser();
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // 자신의 프로필은 /users/profile 엔드포인트를 호출
    if (userUuid) {
      setLoading(true);
      axiosInstance
        .get("/users/profile")
        .then((res) => {
          if (res.data.success) {
            setProfile(res.data.profile);
          } else {
            setError("프로필 정보를 불러올 수 없습니다.");
          }
        })
        .catch((err) => {
          console.error("프로필 정보 조회 실패:", err);
          setError("프로필 정보를 불러오는 데 실패했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userUuid]);

  return { profile, loading, error };
};
