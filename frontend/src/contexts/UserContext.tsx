// /frontend/src/contexts/UserContext.tsx

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

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

// 프로바이더 props 인터페이스
interface UserProviderProps {
  children: ReactNode;
}

// 사용자 컨텍스트 프로바이더
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userUuid, setUserUuid] = useState<string>("");

  // 컨텍스트 값 메모이제이션: 불필요한 리렌더링 방지
  const value = useMemo(() => ({ userUuid, setUserUuid }), [userUuid]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 컨텍스트 사용을 위한 커스텀 훅
export const useUser = (): IUserContext => useContext(UserContext);
