// 파일명: UserContext.tsx

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext"; // 🔄 소켓 컨텍스트 훅 import

// 사용자 컨텍스트 인터페이스
export interface IUserContext {
  userUuid: string;
  setUserUuid: (uuid: string) => void;
  requestCount: number;
  refreshRequestCount: () => Promise<void>;
  logout: () => void;
}

// 초기값 설정
const UserContext = createContext<IUserContext>({
  userUuid: "",
  setUserUuid: () => {},
  requestCount: 0,
  refreshRequestCount: async () => {},
  logout: () => {},
});

// 사용자 컨텍스트 프로바이더
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userUuid, setUserUuid] = useState<string>("");
  const [requestCount, setRequestCount] = useState<number>(0);
  const { socket } = useSocket(); // 🔄 소켓 가져오기

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

    if (!socket) return;

    const handleFriendRequest = () => {
      fetchRequestCount();
    };

    socket.on("friendRequestReceived", handleFriendRequest);

    return () => {
      socket.off("friendRequestReceived", handleFriendRequest);
    };
  }, [socket]); // 🔄 socket 의존성 추가

  // 로그아웃 시 소켓 연결 끊기 및 사용자 정보 초기화
  const logout = () => {
    if (socket) {
      socket.disconnect();
    }
    setUserUuid("");
  };

  return (
    <UserContext.Provider
      value={{
        userUuid,
        setUserUuid,
        requestCount,
        refreshRequestCount: fetchRequestCount,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// 사용자 정보 + 친구 요청 수 접근 훅
export const useUser = () => useContext(UserContext);
