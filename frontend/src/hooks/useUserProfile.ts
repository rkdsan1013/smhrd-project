// /frontend/src/hooks/useUserProfile.ts

import { useState, useEffect, useCallback } from "react";
import { fetchUserProfile } from "../services/userService";
import { useUser } from "../contexts/UserContext";

export interface UserProfile {
  uuid: string;
  email: string;
  name: string;
  gender?: string;
  birthdate?: string;
  paradoxFlag?: boolean;
  profilePicture?: string;
}

// 사용자 프로필을 가져오는 커스텀 훅, forceRefresh와 version 지원
export const useUserProfile = () => {
  const { userUuid } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [version, setVersion] = useState<number>(0);

  // refresh 토글 및 버전 증가
  const forceRefresh = useCallback(() => {
    setRefresh((prev) => !prev);
    setVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!userUuid) return;

    const loadUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserProfile();
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError("프로필 정보를 불러올 수 없습니다.");
        }
      } catch (err: any) {
        console.error("프로필 조회 실패:", err);
        setError("프로필 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userUuid, refresh]);

  return { profile, loading, error, forceRefresh, version };
};
