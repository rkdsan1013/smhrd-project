// /frontend/src/contexts/FriendContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
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

  // 친구 목록 불러오기
  const loadFriends = async () => {
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
  };

  // 친구 요청 목록 불러오기
  const loadFriendRequests = async () => {
    try {
      const requests = await fetchReceivedFriendRequests();
      setFriendRequests(requests);
    } catch (err) {
      console.error("친구 요청 로드 실패", err);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  // 소켓 이벤트 처리
  useEffect(() => {
    if (!socket) return;

    // 친구 삭제 이벤트: 친구 목록 및 온라인 상태 갱신
    const handleFriendRemoved = ({ removedUuid }: { removedUuid: string }) => {
      setFriends((prev) => prev.filter((f) => f.uuid !== removedUuid));
      setOnlineStatus((prev) => {
        const copy = { ...prev };
        delete copy[removedUuid];
        return copy;
      });
    };

    // 친구 요청 수신 시 요청 목록 업데이트
    const handleFriendRequestReceived = () => {
      loadFriendRequests();
    };

    // 친구 요청 응답 시 무조건 친구 목록 갱신 (요청자, 수락자 모두 대상)
    const handleFriendRequestResponded = (_: {
      targetUuid: string;
      status: "accepted" | "declined";
    }) => {
      loadFriends();
    };

    // 개별 온라인/오프라인 상태 업데이트
    const handleUserOnlineStatus = ({ uuid, online }: { uuid: string; online: boolean }) => {
      setOnlineStatus((prev) => ({ ...prev, [uuid]: online }));
    };

    // 전체 온라인 상태 업데이트
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
    socket.on("userOnlineStatus", handleUserOnlineStatus);
    socket.on("friendsOnlineStatus", handleFriendsOnlineStatus);

    return () => {
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("friendRequestReceived", handleFriendRequestReceived);
      socket.off("friendRequestResponded", handleFriendRequestResponded);
      socket.off("userOnlineStatus", handleUserOnlineStatus);
      socket.off("friendsOnlineStatus", handleFriendsOnlineStatus);
    };
  }, [socket]);

  // 친구 목록 변경 시 온라인 상태 업데이트 요청
  useEffect(() => {
    if (socket) {
      socket.emit("getFriendsOnlineStatus");
    }
  }, [socket, friends]);

  return (
    <FriendContext.Provider
      value={{
        friends,
        loading,
        error,
        loadFriends,
        friendRequests,
        loadFriendRequests,
        onlineStatus,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};

export const useFriend = () => useContext(FriendContext);
