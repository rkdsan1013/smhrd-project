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
    }
  };

  // 앱 초기 렌더링 시 사용자 인증 상태 확인
  useEffect(() => { fetchCurrentUser(); }, []);

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

  return isLoggedIn ? <MainPage /> : <LandingPage />;
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;