// /frontend/src/hooks/useUserProfile.ts
import { useState, useEffect } from "react";
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

// 자신의 프로필 정보를 가져오는 훅
export const useUserProfile = () => {
  const { userUuid } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (userUuid) {
      setLoading(true);
      fetchUserProfile()
        .then((data) => {
          if (data.success) {
            setProfile(data.profile);
          } else {
            setError("프로필 정보를 불러올 수 없습니다.");
          }
        })
        .catch((err) => {
          console.error("프로필 조회 실패:", err);
          setError("프로필 정보를 불러오는 데 실패했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userUuid]);

  return { profile, loading, error };
};
