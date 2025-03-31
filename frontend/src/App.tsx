// /frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import { get, post } from "./services/apiClient";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import TestPage from "./pages/TestPage";
import { UserProvider, useUser } from "./contexts/UserContext";
import startTokenRefreshPolling from "./utils/tokenManager";

const AppContent: React.FC = () => {
  const { setUserUuid } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // 인증 체크 완료 여부

  // 사용자 인증 상태 확인 함수 - access 토큰이 없을 경우 refresh 처리
  const fetchCurrentUser = async () => {
    try {
      // 먼저 /auth/me 엔드포인트를 호출하여 인증 상태 확인
      const data = await get<{ user?: { uuid: string } }>("/auth/me");
      if (data?.user) {
        setUserUuid(data.user.uuid);
        setIsLoggedIn(true);
        return;
      }
      // user 정보가 없으면 강제로 에러 발생 (아래 refresh 처리로 넘어감)
      throw new Error("사용자 정보 없음");
    } catch (error: any) {
      console.warn("사용자 인증 확인 에러:", error);
      // access 토큰 문제로 인증 실패한 경우 refresh 토큰으로 재발급 시도
      try {
        const refreshData = await post<{ success: boolean }>("/auth/refresh", {});
        if (refreshData.success) {
          // refresh 성공 후 다시 /auth/me 호출하여 사용자 정보 확인
          const newData = await get<{ user?: { uuid: string } }>("/auth/me");
          if (newData?.user) {
            setUserUuid(newData.user.uuid);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        setIsLoggedIn(false);
      }
    } finally {
      setIsAuthChecked(true);
    }
  };

  // 앱 초기 렌더링 시 사용자 인증 체크
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 로그인 상태면 토큰 갱신 폴링 시작
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isLoggedIn) {
      cleanup = startTokenRefreshPolling();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [isLoggedIn]);

  // 로그인 상태면 30초마다 사용자 인증 상태 재확인
  useEffect(() => {
    if (isLoggedIn) {
      const intervalId = setInterval(fetchCurrentUser, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn]);

  // 전역 커스텀 이벤트로 로그인/로그아웃 상태 업데이트
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

  // 인증 체크 전 로딩 스피너 표시
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

  return isLoggedIn ? <TestPage /> : <LandingPage />;
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
