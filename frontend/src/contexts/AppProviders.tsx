// /frontend/src/contexts/AppProviders.tsx

import React from "react";
import { UserProvider } from "./UserContext";
import { UserProfileProvider } from "./UserProfileContext";
import { SocketProvider } from "./SocketContext";
import { FriendProvider } from "./FriendContext";
import { GroupProvider } from "./GroupContext";
import { NotificationProvider } from "./NotificationContext";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
      <UserProfileProvider>
        <SocketProvider>
          <FriendProvider>
            <GroupProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </GroupProvider>
          </FriendProvider>
        </SocketProvider>
      </UserProfileProvider>
    </UserProvider>
  );
};

export default AppProviders;
