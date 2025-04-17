// /frontend/src/contexts/FriendContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import {
  fetchFriendList,
  Friend,
  fetchReceivedFriendRequests,
  ReceivedFriendRequest,
} from "../services/friendService";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";

interface FriendContextValue {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  loadFriends: () => Promise<void>;
  friendRequests: ReceivedFriendRequest[];
  loadFriendRequests: () => Promise<void>;
  onlineStatus: Record<string, boolean>;
}

const FriendContext = createContext<FriendContextValue | undefined>(undefined);

interface FriendProviderProps {
  children: ReactNode;
}

export const FriendProvider: React.FC<FriendProviderProps> = ({ children }) => {
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
      const fetchedFriends = await fetchFriendList();
      setFriends(fetchedFriends);
      setError(null);
    } catch (error) {
      setError("친구 목록 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    try {
      const requests = await fetchReceivedFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error("친구 요청 로드 실패", error);
    }
  }, []);

  // 초기 친구 목록 및 친구 요청 데이터 로드
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  useEffect(() => {
    if (!socket) return;

    const handlers: Record<string, (data: any) => void> = {
      friendRemoved: ({ removedUuid }: { removedUuid: string }) => {
        setFriends((prev) => prev.filter((friend) => friend.uuid !== removedUuid));
        setOnlineStatus((prev) => {
          const updatedStatus = { ...prev };
          delete updatedStatus[removedUuid];
          return updatedStatus;
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
        const updatedStatus = Object.fromEntries(
          statusList.map(({ uuid, online }) => [uuid, online]),
        );
        setOnlineStatus(updatedStatus);
      },
    };

    // 소켓 이벤트 핸들러 등록
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // 컴포넌트 언마운트 시 이벤트 클린업
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, loadFriends, loadFriendRequests, userUuid]);

  // 친구 온라인 상태 요청
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

export const useFriend = (): FriendContextValue => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error("useFriend must be used within a FriendProvider");
  }
  return context;
};
