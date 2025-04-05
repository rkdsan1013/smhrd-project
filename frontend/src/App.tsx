// /frontend/src/App.tsx

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { get, post } from "./services/apiClient";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import { UserProvider, useUser } from "./contexts/UserContext";
import startTokenRefreshPolling from "./utils/tokenManager";
import Icons from "./components/Icons";
import { SocketProvider } from "./contexts/SocketContext";

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
        <Icons name="spinner" className="animate-spin w-12 h-12 text-gray-200 fill-blue-600" />
      </div>
    );
  }

  // 페이지 전환 애니메이션 : 로그인 상태면 MainPage, 아니면 LandingPage 렌더링
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoggedIn ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-full"
          >
            {/* 로그인 상태에서만 SocketProvider를 렌더링하여 소켓 연결 유지 */}
            <SocketProvider>
              <MainPage />
            </SocketProvider>
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
