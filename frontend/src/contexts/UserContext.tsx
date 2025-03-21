// /frontend/src/contexts/UserContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export interface IUserContext {
  userUuid: string;
  // 다른 부가적인 정보는 여기 포함하지 않고, 필요하면 API 호출로 가져오기
  setUserUuid: (uuid: string) => void;
}

const UserContext = createContext<IUserContext>({
  userUuid: "",
  setUserUuid: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userUuid, setUserUuid] = useState<string>("");

  return <UserContext.Provider value={{ userUuid, setUserUuid }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
