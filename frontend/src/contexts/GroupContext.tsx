// /frontend/src/contexts/GroupContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
import { getSentGroupInvites } from "../services/groupService";

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
  clearInvitesFromGroup: (groupUuid: string) => void;
  acceptedUserUuids: string[];
  rejectedUserUuids: string[];
  removePendingInvite: (uuid: string) => void;
  addPendingInvite: (uuid: string, inviteUuid: string) => void;
  pendingInvites: Record<string, string>;
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

interface GroupProviderProps {
  children: React.ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  const { userUuid } = useUser();

  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [acceptedUserUuids, setAcceptedUserUuids] = useState<string[]>([]);
  const [rejectedUserUuids, setRejectedUserUuids] = useState<string[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Record<string, string>>({});

  // ✅ 새로고침 시, DB에서 내가 보낸 초대 불러오기
  useEffect(() => {
    const loadSentGroupInvites = async () => {
      if (!userUuid) return;
      try {
        const groupUuidSet = new Set(groupInvites.map((invite) => invite.groupUuid));
        for (const groupUuid of groupUuidSet) {
          const sent = await getSentGroupInvites(groupUuid);
          const map: Record<string, string> = {};
          for (const item of sent) {
            map[item.invitedUserUuid] = item.inviteUuid;
          }
          setPendingInvites((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("보낸 그룹 초대 불러오기 실패:", err);
      }
    };
    loadSentGroupInvites();
  }, [userUuid, groupInvites]);

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (invite: GroupInvite) => {
      setGroupInvites((prev) => {
        const isDuplicate = prev.some(
          (i) => i.groupUuid === invite.groupUuid && i.inviterUuid === invite.inviterUuid,
        );
        if (isDuplicate) return prev;
        return [...prev, invite];
      });
    };

    const handleInviteCancelled = ({ inviteUuid }: { inviteUuid: string }) => {
      setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
      setPendingInvites((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key] === inviteUuid) delete updated[key];
        }
        return updated;
      });
    };

    const handleInviteAccepted = ({
      invitedUserUuid,
    }: {
      inviteUuid: string;
      invitedUserUuid: string;
      groupUuid: string;
    }) => {
      setAcceptedUserUuids((prev) => [...prev, invitedUserUuid]);
      setPendingInvites((prev) => {
        const copy = { ...prev };
        delete copy[invitedUserUuid];
        return copy;
      });
    };

    const handleInviteRejected = ({
      invitedUserUuid,
    }: {
      inviteUuid: string;
      invitedUserUuid: string;
      groupUuid: string;
    }) => {
      setRejectedUserUuids((prev) => [...prev, invitedUserUuid]);
      setPendingInvites((prev) => {
        const copy = { ...prev };
        delete copy[invitedUserUuid];
        return copy;
      });
    };

    socket.on("group-invite", handleInvite);
    socket.on("groupInviteCancelled", handleInviteCancelled);
    socket.on("groupInviteAccepted", handleInviteAccepted);
    socket.on("groupInviteRejected", handleInviteRejected);

    return () => {
      socket.off("group-invite", handleInvite);
      socket.off("groupInviteCancelled", handleInviteCancelled);
      socket.off("groupInviteAccepted", handleInviteAccepted);
      socket.off("groupInviteRejected", handleInviteRejected);
    };
  }, [socket]);

  const removeInvite = useCallback((inviteUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
  }, []);

  const clearInvitesFromGroup = useCallback((groupUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.groupUuid !== groupUuid));
  }, []);

  const removePendingInvite = useCallback((uuid: string) => {
    setPendingInvites((prev) => {
      const copy = { ...prev };
      delete copy[uuid];
      return copy;
    });
  }, []);

  const addPendingInvite = useCallback((uuid: string, inviteUuid: string) => {
    setPendingInvites((prev) => ({ ...prev, [uuid]: inviteUuid }));
  }, []);

  const value = useMemo(
    () => ({
      groupInvites,
      removeInvite,
      clearInvitesFromGroup,
      acceptedUserUuids,
      rejectedUserUuids,
      pendingInvites,
      removePendingInvite,
      addPendingInvite,
    }),
    [
      groupInvites,
      removeInvite,
      clearInvitesFromGroup,
      acceptedUserUuids,
      rejectedUserUuids,
      pendingInvites,
      removePendingInvite,
      addPendingInvite,
    ],
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
