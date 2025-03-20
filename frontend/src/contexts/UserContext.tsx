// /frontend/src/contexts/UserContext.tsx
import React, { createContext, useState, ReactNode, useContext, useMemo } from 'react';

interface IUserContext {
  userUuid: string;
  setUserUuid: (uuid: string) => void;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userUuid, setUserUuid] = useState<string>('');
  const value = useMemo(() => ({ userUuid, setUserUuid }), [userUuid]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): IUserContext => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;