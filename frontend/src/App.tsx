// /frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import { UserProvider, useUser } from "./contexts/UserContext";
import startTokenRefreshPolling from "./utils/tokenManager";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AppContent: React.FC = () => {
  const { setUserUuid } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // 인증 여부 확인 상태

  const fetchCurrentUser = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true });
      if (data?.user) {
        setUserUuid(data.user.uuid);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error: any) {
      console.warn("사용자 인증 확인 에러:", error);
      setIsLoggedIn(false);
    } finally {
      setIsAuthChecked(true); // 인증 체크 완료
    }
  };

  // 앱 초기 렌더링 시 사용자 인증 상태 확인
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 로그인 상태일 때 토큰 갱신 폴링 수행
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isLoggedIn) {
      cleanup = startTokenRefreshPolling();
    }
    return () => cleanup && cleanup();
  }, [isLoggedIn]);

  // 로그인 상태 시 30초마다 /auth/me 호출하여 인증 유지 검증
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (isLoggedIn) {
      intervalId = setInterval(fetchCurrentUser, 30000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [isLoggedIn]);

  // 전역 커스텀 이벤트를 통한 로그인/로그아웃 상태 업데이트
  useEffect(() => {
    const onSignOut = () => setIsLoggedIn(false);
    const onSignIn = (e: CustomEvent) => {
      if (e.detail?.user) setUserUuid(e.detail.user.uuid);
      setIsLoggedIn(true);
    };

    window.addEventListener("userSignedOut", onSignOut);
    window.addEventListener("userSignedIn", onSignIn as EventListener);
    return () => {
      window.removeEventListener("userSignedOut", onSignOut);
      window.removeEventListener("userSignedIn", onSignIn as EventListener);
    };
  }, [setUserUuid]);

  // 인증 체크가 완료되기 전에는 로딩 스피너 표시
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg
          className="animate-spin h-12 w-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return isLoggedIn ? <MainPage /> : <LandingPage />;
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
