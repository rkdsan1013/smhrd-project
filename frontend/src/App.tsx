// /frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { get, post } from "./services/apiClient";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import Test from "./pages/Test";
import { UserProvider, useUser } from "./contexts/UserContext";
import startTokenRefreshPolling from "./utils/tokenManager";

const AppContent: React.FC = () => {
  const { setUserUuid } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // 사용자 인증 상태 확인 및 토큰 리프레시 처리
  const fetchCurrentUser = async () => {
    try {
      const data = await get<{ user?: { uuid: string } }>("/auth/me");
      if (data?.user) {
        setUserUuid(data.user.uuid);
        setIsLoggedIn(true);
        return;
      }
      throw new Error("사용자 정보 없음");
    } catch (error: any) {
      console.warn("사용자 인증 확인 에러:", error);
      try {
        const refreshData = await post<{ success: boolean }>("/auth/refresh", {});
        if (refreshData.success) {
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

  // 초기 인증 검사
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 로그인 상태일 때 토큰 갱신 폴링 시작
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isLoggedIn) {
      cleanup = startTokenRefreshPolling();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [isLoggedIn]);

  // 로그인 상태일 때 30초마다 사용자 인증 재확인
  useEffect(() => {
    if (isLoggedIn) {
      const intervalId = setInterval(fetchCurrentUser, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn]);

  // 전역 이벤트 리스너로 로그인/로그아웃 상태 업데이트
  useEffect(() => {
    const handleSignOut = () => setIsLoggedIn(false);
    const handleSignIn = (e: CustomEvent) => {
      if (e.detail?.user) setUserUuid(e.detail.user.uuid);
      setIsLoggedIn(true);
    };
    window.addEventListener("userSignedOut", handleSignOut);
    window.addEventListener("userSignedIn", handleSignIn as EventListener);
    return () => {
      window.removeEventListener("userSignedOut", handleSignOut);
      window.removeEventListener("userSignedIn", handleSignIn as EventListener);
    };
  }, [setUserUuid]);

  // 인증 체크 전에는 로딩 스피너 표시
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // 페이지 전환 애니메이션: 로그인 상태에 따라 TestPage 또는 LandingPage가 자연스럽게 페이드 슬라이드로 전환됨
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoggedIn ? (
          <motion.div
            key="test"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-full"
          >
            <MainPage />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-full"
          >
            <LandingPage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
