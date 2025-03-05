// /src/contexts/UserContext.tsx
import React, { createContext, useState, ReactNode, useContext, useMemo } from 'react';

interface IUserContext {
  username: string;
  setUsername: (username: string) => void;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('');

  const contextValue = useMemo(() => ({ username, setUsername }), [username]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = (): IUserContext => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
