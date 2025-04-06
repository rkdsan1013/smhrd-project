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

  // loadFriends와 loadFriendRequests 함수를 useCallback으로 메모이제이션
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

  // 소켓 이벤트 처리
  useEffect(() => {
    if (!socket) return;

    const handleFriendRemoved = ({ removedUuid }: { removedUuid: string }) => {
      setFriends((prev) => prev.filter((f) => f.uuid !== removedUuid));
      setOnlineStatus((prev) => {
        const copy = { ...prev };
        delete copy[removedUuid];
        return copy;
      });
    };

    const handleFriendRequestReceived = () => {
      loadFriendRequests();
    };

    const handleFriendRequestResponded = (_: {
      targetUuid: string;
      status: "accepted" | "declined";
    }) => {
      loadFriends();
    };

    // 친구 요청 취소 시, 오직 친구 요청 목록만 갱신하도록 수정
    const handleFriendRequestCancelled = (_: { targetUuid: string }) => {
      loadFriendRequests();
    };

    const handleUserOnlineStatus = ({ uuid, online }: { uuid: string; online: boolean }) => {
      setOnlineStatus((prev) => ({ ...prev, [uuid]: online }));
    };

    const handleFriendsOnlineStatus = (statusList: { uuid: string; online: boolean }[]) => {
      const updated: Record<string, boolean> = {};
      statusList.forEach(({ uuid, online }) => {
        updated[uuid] = online;
      });
      setOnlineStatus(updated);
    };

    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("friendRequestReceived", handleFriendRequestReceived);
    socket.on("friendRequestResponded", handleFriendRequestResponded);
    socket.on("friendRequestCancelled", handleFriendRequestCancelled);
    socket.on("userOnlineStatus", handleUserOnlineStatus);
    socket.on("friendsOnlineStatus", handleFriendsOnlineStatus);

    return () => {
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("friendRequestReceived", handleFriendRequestReceived);
      socket.off("friendRequestResponded", handleFriendRequestResponded);
      socket.off("friendRequestCancelled", handleFriendRequestCancelled);
      socket.off("userOnlineStatus", handleUserOnlineStatus);
      socket.off("friendsOnlineStatus", handleFriendsOnlineStatus);
    };
  }, [socket, loadFriends, loadFriendRequests]);

  // 친구 목록 변경 시 온라인 상태 다시 요청
  useEffect(() => {
    if (socket) {
      socket.emit("getFriendsOnlineStatus");
    }
  }, [socket, friends]);

  // 제공할 값들을 useMemo로 감싸서 불필요한 재랜더링 방지
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
