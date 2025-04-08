// /frontend/src/contexts/GroupContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSocket } from "./SocketContext";

export interface GroupInvite {
  inviteUuid: string;
  groupUuid: string;
  groupName: string;
  inviterUuid: string;
  inviterName: string;
}

export interface GroupContextValue {
  groupInvites: GroupInvite[];
  removeInvite: (inviteUuid: string) => void;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

interface GroupProviderProps {
  children: React.ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);

  useEffect(() => {
    if (!socket) return;

    // 새로운 그룹 초대 이벤트 핸들러 등록
    const handleInvite = (invite: GroupInvite) => {
      setGroupInvites((prev) => [...prev, invite]);
    };

    socket.on("group-invite", handleInvite);

    return () => {
      socket.off("group-invite", handleInvite);
    };
  }, [socket]);

  const removeInvite = useCallback((inviteUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
  }, []);

  const value = useMemo(
    () => ({
      groupInvites,
      removeInvite,
    }),
    [groupInvites, removeInvite],
  );

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroup = (): GroupContextValue => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
};
