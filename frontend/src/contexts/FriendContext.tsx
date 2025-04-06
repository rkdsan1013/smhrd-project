// frontend/src/contexts/FriendContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import {
  fetchFriendList,
  Friend,
  fetchReceivedFriendRequests,
  ReceivedFriendRequest,
} from "../services/friendService";
import { useSocket } from "./SocketContext";

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

  // loadFriends와 loadFriendRequests를 useCallback으로 메모이제이션
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

  // 초기 데이터 로드
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  // 소켓 이벤트 핸들러들을 하나의 객체에 모아서 반복 등록/해제로 처리
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
      },
      friendRequestCancelled: () => {
        loadFriendRequests();
      },
      userOnlineStatus: ({ uuid, online }: { uuid: string; online: boolean }) => {
        setOnlineStatus((prev) => ({ ...prev, [uuid]: online }));
      },
      friendsOnlineStatus: (statusList: { uuid: string; online: boolean }[]) => {
        const updated = Object.fromEntries(statusList.map(({ uuid, online }) => [uuid, online]));
        setOnlineStatus(updated);
      },
    };

    // 등록
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    // 해제
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, loadFriends, loadFriendRequests]);

  // 친구 목록이 변경되면 온라인 상태 다시 요청
  useEffect(() => {
    if (socket) {
      socket.emit("getFriendsOnlineStatus");
    }
  }, [socket, friends]);

  // useMemo를 이용하여 제공할 값들을 캐싱 (불필요한 리렌더링 방지)
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
