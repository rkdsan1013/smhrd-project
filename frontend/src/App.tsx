// /frontend/src/App.tsx

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { get, post } from "./services/apiClient";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import startTokenRefreshPolling from "./utils/tokenManager";
import Icons from "./components/Icons";
import AppProviders from "./contexts/AppProviders";
import { UserProvider, useUser } from "./contexts/UserContext";

const MOTION_TRANSITION = { duration: 0.5, ease: "easeInOut" };
const REFRESH_INTERVAL_MS = 30000;

const AppContent: React.FC = () => {
  const { setUserUuid } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);

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

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isLoggedIn) {
      cleanup = startTokenRefreshPolling();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const intervalId = setInterval(fetchCurrentUser, REFRESH_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn]);

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

  if (!isAuthChecked) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <Icons name="spinner" className="animate-spin w-12 h-12 text-gray-300 fill-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoggedIn ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={MOTION_TRANSITION}
            className="h-full"
          >
            <AppProviders>
              <MainPage />
            </AppProviders>
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={MOTION_TRANSITION}
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
