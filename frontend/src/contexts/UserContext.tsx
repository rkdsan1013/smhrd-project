// /frontend/src/contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import socket from "../services/socket";

// 사용자 컨텍스트 인터페이스
export interface IUserContext {
  userUuid: string;
  setUserUuid: (uuid: string) => void;
  requestCount: number;
  refreshRequestCount: () => Promise<void>;
}

// 초기값 설정
const UserContext = createContext<IUserContext>({
  userUuid: "",
  setUserUuid: () => {},
  requestCount: 0,
  refreshRequestCount: async () => {},
});

// 사용자 컨텍스트 프로바이더
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userUuid, setUserUuid] = useState<string>("");
  const [requestCount, setRequestCount] = useState<number>(0);

  // 친구 요청 수 가져오기
  const fetchRequestCount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/friends/received`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setRequestCount(data.requests.length);
      }
    } catch (err) {
      console.error("친구 요청 수 가져오기 실패:", err);
    }
  };

  // 소켓으로 친구 요청 수신 → 수 다시 불러오기
  useEffect(() => {
    fetchRequestCount();

    socket.on("friendRequestReceived", () => {
      fetchRequestCount();
    });

    return () => {
      socket.off("friendRequestReceived");
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        userUuid,
        setUserUuid,
        requestCount,
        refreshRequestCount: fetchRequestCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// 사용자 정보 + 친구 요청 수 접근 훅
export const useUser = () => useContext(UserContext);
