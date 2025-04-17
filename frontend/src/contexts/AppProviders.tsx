// /frontend/src/contexts/AppProviders.tsx

import React from "react";
import { UserProfileProvider } from "./UserProfileContext";
import { SocketProvider } from "./SocketContext";
import { FriendProvider } from "./FriendContext";
import { GroupProvider } from "./GroupContext";
import { NotificationProvider } from "./NotificationContext";
import { ScheduleProvider } from "./ScheduleContext"; // ScheduleProvider 추가

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UserProfileProvider>
      <SocketProvider>
        <FriendProvider>
          <GroupProvider>
            <NotificationProvider>
              <ScheduleProvider>{children}</ScheduleProvider>
            </NotificationProvider>
          </GroupProvider>
        </FriendProvider>
      </SocketProvider>
    </UserProfileProvider>
  );
};

export default AppProviders;
