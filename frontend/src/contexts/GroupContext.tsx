// /frontend/src/contexts/GroupContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext"; // ✅ SocketContext를 통해 socket 사용

interface GroupInvite {
  inviteUuid: string;
  groupUuid: string;
  groupName: string;
  inviterUuid: string;
  inviterName: string;
}

interface GroupContextValue {
  groupInvites: GroupInvite[];
  removeInvite: (groupUuid: string) => void;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket(); // ✅ socketContext에서 가져오기
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (invite: GroupInvite) => {
      setGroupInvites((prev) => [...prev, invite]);
    };

    socket.on("group-invite", handleInvite);

    return () => {
      socket.off("group-invite", handleInvite);
    };
  }, [socket]);

  const removeInvite = (inviteUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
  };

  return (
    <GroupContext.Provider value={{ groupInvites, removeInvite }}>{children}</GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroup must be used within a GroupProvider");
  return context;
};
