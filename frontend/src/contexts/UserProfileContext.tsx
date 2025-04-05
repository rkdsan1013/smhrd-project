// /frontend/src/contexts/UserProfileContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchUserProfile } from "../services/userService";

// 프로필 인터페이스 정의 (버전 정보 추가)
export interface UserProfile {
  name: string;
  email: string;
  profilePicture?: string;
  birthdate?: string;
  gender?: string;
  paradoxFlag?: boolean;
  version?: string; // 캐시 우회를 위한 버전
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  reloadProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export const UserProfileProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // fetchUserProfile가 { success, profile } 형식의 데이터를 반환한다고 가정
      const data: { success: boolean; profile: UserProfile } = await fetchUserProfile();
      if (data.success) {
        const updatedProfile = data.profile;
        // 프로필 사진이 있으면 강제로 현재 타임스탬프를 version에 넣어 캐시를 우회
        if (updatedProfile.profilePicture) {
          updatedProfile.version = new Date().getTime().toString();
        }
        setProfile(updatedProfile);
      } else {
        setError("프로필 정보를 불러오는데 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "프로필 정보를 불러오는 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, loading, error, reloadProfile: loadProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextValue => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile은 UserProfileProvider 내부에서 사용되어야 합니다.");
  }
  return context;
};
