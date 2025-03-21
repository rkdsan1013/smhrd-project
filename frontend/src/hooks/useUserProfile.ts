// /frontend/src/hooks/useUserProfile.ts
import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

export interface IUserProfile {
  uuid: string;
  email: string;
  name: string;
  profile_picture?: string;
  birthdate?: string;
  gender?: string;
}

export const useUserProfile = () => {
  const { userUuid } = useUser();
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (userUuid) {
      setLoading(true);
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/users/${userUuid}`, {
          withCredentials: true,
        })
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
