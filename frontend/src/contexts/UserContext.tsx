// /src/contexts/UserContext.tsx

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

interface IUserContext {
  username: string;
  setUsername: (username: string) => void;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('');

  // username이 변경될 때만 새로운 객체를 생성하여 불필요한 리렌더링 방지
  const value = useMemo(() => ({ username, setUsername }), [username]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): IUserContext => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
