// /frontend/src/contexts/FriendContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import {
  fetchFriendList,
  Friend,
  fetchReceivedFriendRequests,
  ReceivedFriendRequest,
} from "../services/friendService";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";

interface IFriendContext {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  loadFriends: () => Promise<void>;
  friendRequests: ReceivedFriendRequest[];
  loadFriendRequests: () => Promise<void>;
  onlineStatus: Record<string, boolean>;
}

const FriendContext = createContext<IFriendContext>({
  friends: [],
  loading: false,
  error: null,
  loadFriends: async () => {},
  friendRequests: [],
  loadFriendRequests: async () => {},
  onlineStatus: {},
});

export const FriendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<ReceivedFriendRequest[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  const { socket } = useSocket();
  const { userUuid } = useUser();

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchFriendList();
      setFriends(fetched);
      setError(null);
    } catch (err) {
      setError("친구 목록 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    try {
      const requests = await fetchReceivedFriendRequests();
      setFriendRequests(requests);
    } catch (err) {
      console.error("친구 요청 로드 실패", err);
    }
  }, []);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  useEffect(() => {
    if (!socket) return;

    const handlers: Record<string, (data: any) => void> = {
      friendRemoved: ({ removedUuid }: { removedUuid: string }) => {
        setFriends((prev) => prev.filter((f) => f.uuid !== removedUuid));
        setOnlineStatus((prev) => {
          const copy = { ...prev };
          delete copy[removedUuid];
          return copy;
        });
      },
      friendRequestReceived: () => {
        loadFriendRequests();
      },
      friendRequestResponded: () => {
        loadFriends();
        loadFriendRequests();
      },
      friendRequestCancelled: () => {
        loadFriends();
        loadFriendRequests();
      },
      friendRequestSent: ({ to }: { to: string }) => {
        if (to === userUuid) {
          loadFriendRequests();
        }
      },
      userOnlineStatus: ({ uuid, online }: { uuid: string; online: boolean }) => {
        setOnlineStatus((prev) => ({ ...prev, [uuid]: online }));
      },
      friendsOnlineStatus: (statusList: { uuid: string; online: boolean }[]) => {
        const updated = Object.fromEntries(statusList.map(({ uuid, online }) => [uuid, online]));
        setOnlineStatus(updated);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, loadFriends, loadFriendRequests, userUuid]);

  useEffect(() => {
    if (socket) {
      socket.emit("getFriendsOnlineStatus");
    }
  }, [socket, friends]);

  const value = useMemo(
    () => ({
      friends,
      loading,
      error,
      loadFriends,
      friendRequests,
      loadFriendRequests,
      onlineStatus,
    }),
    [friends, loading, error, loadFriends, friendRequests, loadFriendRequests, onlineStatus],
  );

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
};

export const useFriend = () => useContext(FriendContext);
