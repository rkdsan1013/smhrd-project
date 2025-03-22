// /frontend/src/contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

// 사용자 컨텍스트 인터페이스
export interface IUserContext {
  userUuid: string;
  setUserUuid: (uuid: string) => void;
}

// 초기값: userUuid는 빈 문자열
const UserContext = createContext<IUserContext>({
  userUuid: "",
  setUserUuid: () => {},
});

// 사용자 컨텍스트 프로바이더
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userUuid, setUserUuid] = useState<string>("");
  return <UserContext.Provider value={{ userUuid, setUserUuid }}>{children}</UserContext.Provider>;
};

// 컨텍스트 사용을 위한 커스텀 훅
export const useUser = () => useContext(UserContext);
