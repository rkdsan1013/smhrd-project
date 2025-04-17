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
  removePendingInvite: (groupUuid: string, userUuid: string) => void;
  addPendingInvite: (groupUuid: string, userUuid: string, inviteUuid: string) => void;
  pendingInvites: Record<string, Record<string, string>>; // groupUuid → { userUuid: inviteUuid }
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { userUuid } = useUser();

  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [acceptedUserUuids, setAcceptedUserUuids] = useState<string[]>([]);
  const [rejectedUserUuids, setRejectedUserUuids] = useState<string[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Record<string, Record<string, string>>>({});

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
          setPendingInvites((prev) => ({ ...prev, [groupUuid]: map }));
        }
      } catch (err) {
        console.error("보낸 그룹 초대 불러오기 실패:", err);
      }
    };
    loadSentGroupInvites();
  }, [userUuid, groupInvites]);

  useEffect(() => {
    if (!socket) return;

    socket.on("group-invite", (invite: GroupInvite) => {
      setGroupInvites((prev) => {
        const isDuplicate = prev.some(
          (i) => i.groupUuid === invite.groupUuid && i.inviterUuid === invite.inviterUuid,
        );
        if (isDuplicate) return prev;
        return [...prev, invite];
      });
    });

    socket.on("groupInviteCancelled", ({ inviteUuid }: { inviteUuid: string }) => {
      setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
      setPendingInvites((prev) => {
        const updated = { ...prev };
        for (const group in updated) {
          for (const user in updated[group]) {
            if (updated[group][user] === inviteUuid) delete updated[group][user];
          }
        }
        return updated;
      });
    });

    socket.on(
      "groupInviteAccepted",
      ({ groupUuid, invitedUserUuid }: { groupUuid: string; invitedUserUuid: string }) => {
        setAcceptedUserUuids((prev) => [...prev, invitedUserUuid]);
        removePendingInvite(groupUuid, invitedUserUuid);
      },
    );

    socket.on(
      "groupInviteRejected",
      ({ groupUuid, invitedUserUuid }: { groupUuid: string; invitedUserUuid: string }) => {
        setRejectedUserUuids((prev) => [...prev, invitedUserUuid]);
        removePendingInvite(groupUuid, invitedUserUuid);
      },
    );

    return () => {
      socket.off("group-invite");
      socket.off("groupInviteCancelled");
      socket.off("groupInviteAccepted");
      socket.off("groupInviteRejected");
    };
  }, [socket]);

  const removeInvite = useCallback((inviteUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.inviteUuid !== inviteUuid));
  }, []);

  const clearInvitesFromGroup = useCallback((groupUuid: string) => {
    setGroupInvites((prev) => prev.filter((invite) => invite.groupUuid !== groupUuid));
  }, []);

  const removePendingInvite = useCallback((groupUuid: string, userUuid: string) => {
    setPendingInvites((prev) => {
      const copy = { ...prev };
      if (copy[groupUuid]) {
        delete copy[groupUuid][userUuid];
        if (Object.keys(copy[groupUuid]).length === 0) delete copy[groupUuid];
      }
      return copy;
    });
  }, []);

  const addPendingInvite = useCallback(
    (groupUuid: string, userUuid: string, inviteUuid: string) => {
      setPendingInvites((prev) => ({
        ...prev,
        [groupUuid]: {
          ...(prev[groupUuid] || {}),
          [userUuid]: inviteUuid,
        },
      }));
    },
    [],
  );

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
  if (!context) throw new Error("useGroup must be used within a GroupProvider");
  return context;
};
