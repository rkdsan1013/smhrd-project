// /frontend/src/components/FriendList.tsx

import React, { useEffect, useState } from "react";
import {
  fetchFriendList,
  Friend,
  searchUsers,
  SearchResultUser,
  sendFriendRequest,
  fetchReceivedFriendRequests,
  ReceivedFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "../services/friendService";
import { openOrCreateDMRoom } from "../services/chatService";
import FriendProfileCard from "./FriendProfileCard";
import Icons from "./Icons";
import DirectMessage from "./DirectMessage";
import { useUser } from "../contexts/UserContext";
import { useSocket } from "../contexts/SocketContext";

interface FriendListProps {
  onClose: () => void;
}

const FriendList: React.FC<FriendListProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"list" | "requests">("list");
  const [isAdding, setIsAdding] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receivedRequests, setReceivedRequests] = useState<ReceivedFriendRequest[]>([]);
  const [selectedFriendUuid, setSelectedFriendUuid] = useState<string | null>(null);
  const [dmRoomUuid, setDmRoomUuid] = useState<string | null>(null);

  const { userUuid, requestCount, refreshRequestCount } = useUser();
  const { socket } = useSocket();

  // 공통 리스트 아이템 클래스 (고정 높이, 여백)
  const liClass = "flex items-center justify-between h-12 px-3 py-2 rounded hover:bg-gray-100";

  const loadFriends = async () => {
    try {
      setLoading(true);
      const res = await fetchFriendList();
      setFriends(res);
    } catch (err: any) {
      setError(err.message || "친구 목록 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const loadReceivedRequests = async () => {
    try {
      const data = await fetchReceivedFriendRequests();
      setReceivedRequests(data);
    } catch (err) {
      console.error("친구 요청 목록 불러오기 실패", err);
    }
  };

  useEffect(() => {
    if (activeTab === "list" && !isAdding) {
      loadFriends();
    }
  }, [isAdding, activeTab]);

  useEffect(() => {
    if (activeTab === "requests") {
      loadReceivedRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;
    const handleFriendRequestReceived = () => {
      refreshRequestCount();
      if (activeTab === "requests") {
        loadReceivedRequests();
      }
    };
    socket.on("friendRequestReceived", handleFriendRequestReceived);
    return () => {
      socket.off("friendRequestReceived", handleFriendRequestReceived);
    };
  }, [socket, activeTab, refreshRequestCount]);

  useEffect(() => {
    if (!socket) return;
    const handleFriendRequestResponded = ({
      targetUuid,
      status,
    }: {
      targetUuid: string;
      status: "accepted" | "declined";
    }) => {
      setSearchResults((prev) =>
        prev.map((user) =>
          user.uuid === targetUuid
            ? { ...user, friendStatus: status === "accepted" ? "accepted" : undefined }
            : user,
        ),
      );
    };
    socket.on("friendRequestResponded", handleFriendRequestResponded);
    return () => {
      socket.off("friendRequestResponded", handleFriendRequestResponded);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleFriendRemoved = ({ removedUuid }: { removedUuid: string }) => {
      setFriends((prev) => prev.filter((f) => f.uuid !== removedUuid));
    };
    socket.on("friendRemoved", handleFriendRemoved);
    return () => {
      socket.off("friendRemoved", handleFriendRemoved);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleUserOnlineStatus = ({ uuid, online }: { uuid: string; online: boolean }) => {
      setOnlineStatusMap((prev) => ({ ...prev, [uuid]: online }));
    };
    socket.on("userOnlineStatus", handleUserOnlineStatus);
    return () => {
      socket.off("userOnlineStatus", handleUserOnlineStatus);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("getFriendsOnlineStatus");
    const handleFriendsOnlineStatus = (statusList: { uuid: string; online: boolean }[]) => {
      const updatedStatusMap: Record<string, boolean> = {};
      statusList.forEach(({ uuid, online }) => {
        updatedStatusMap[uuid] = online;
      });
      setOnlineStatusMap(updatedStatusMap);
    };
    socket.on("friendsOnlineStatus", handleFriendsOnlineStatus);
    return () => {
      socket.off("friendsOnlineStatus", handleFriendsOnlineStatus);
    };
  }, [socket]);

  const sortSearchResults = (list: SearchResultUser[]) => {
    return [...list].sort((a, b) => {
      const weight = (status: string | null | undefined) => {
        if (!status) return 0;
        if (status === "pending") return 1;
        if (status === "accepted") return 2;
        return 3;
      };
      return weight(a.friendStatus) - weight(b.friendStatus);
    });
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    try {
      setSearchLoading(true);
      setSearchError("");
      const results = await searchUsers(searchKeyword);
      const sorted = sortSearchResults(results);
      setSearchResults(sorted);
    } catch (err: any) {
      setSearchError(err.message || "검색 실패");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsAdding((prev) => !prev);
    setSearchKeyword("");
    setSearchResults([]);
    setSearchError("");
  };

  const handleSendFriendRequest = async (targetUuid: string) => {
    try {
      await sendFriendRequest(targetUuid);
      setSearchResults((prev) =>
        prev.map((user) =>
          user.uuid === targetUuid ? { ...user, friendStatus: "pending" } : user,
        ),
      );
    } catch (err: any) {
      alert(err.message || "친구 요청 실패");
    }
  };

  const handleAccept = async (uuid: string) => {
    try {
      await acceptFriendRequest(uuid);
      setReceivedRequests((prev) => prev.filter((r) => r.uuid !== uuid));
      await refreshRequestCount();
      await loadFriends();
    } catch (err: any) {
      alert(err.message || "수락 실패");
    }
  };

  const handleDecline = async (uuid: string) => {
    try {
      await declineFriendRequest(uuid);
      setReceivedRequests((prev) => prev.filter((r) => r.uuid !== uuid));
      await refreshRequestCount();
    } catch (err: any) {
      alert(err.message || "거절 실패");
    }
  };

  const handleFriendClick = (uuid: string) => {
    setSelectedFriendUuid(uuid);
  };

  const closeFriendProfile = () => {
    setSelectedFriendUuid(null);
  };

  const handleMessageClick = async (friendUuid: string) => {
    try {
      const roomUuid = await openOrCreateDMRoom(friendUuid);
      setDmRoomUuid(roomUuid);
    } catch (err) {
      alert("채팅방을 여는 데 실패했습니다.");
    }
  };

  if (dmRoomUuid && userUuid) {
    return (
      <DirectMessage
        roomUuid={dmRoomUuid}
        onBack={() => setDmRoomUuid(null)}
        currentUserUuid={userUuid}
      />
    );
  }

  return (
    // 외부 컨테이너에 overflow-x-hidden 추가하여 좌우 스크롤이 생기지 않도록 설정
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80 overflow-x-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3">
        <div className="flex w-full">
          <button
            onClick={() => {
              setActiveTab("list");
              setIsAdding(false);
            }}
            className={`flex-1 text-sm py-2 border-b-2 ${
              activeTab === "list"
                ? "border-blue-500 font-semibold text-blue-600"
                : "border-transparent text-gray-500"
            }`}
          >
            친구 목록{friends.length > 0 ? ` (${friends.length})` : ""}
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
              setIsAdding(false);
            }}
            className={`flex-1 text-sm py-2 border-b-2 ${
              activeTab === "requests"
                ? "border-blue-500 font-semibold text-blue-600"
                : "border-transparent text-gray-500"
            }`}
          >
            친구 요청{requestCount > 0 ? ` (${requestCount})` : ""}
          </button>
        </div>
        <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-800 transition">
          ✕
        </button>
      </div>

      {/* 본문 */}
      <div className="p-4">
        {activeTab === "list" && (
          <>
            {isAdding ? (
              <>
                <div className="space-y-3 mb-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      placeholder="이메일 또는 이름으로 검색"
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    >
                      검색
                    </button>
                  </div>
                </div>
                <div className="h-60 overflow-y-auto pr-1">
                  {searchLoading ? (
                    <p className="text-center text-gray-500">검색 중...</p>
                  ) : searchError ? (
                    <p className="text-red-500 text-center">{searchError}</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm">검색 결과 없음</p>
                  ) : (
                    <ul className="space-y-2">
                      {searchResults.map((user) => (
                        <li key={user.uuid} className={liClass}>
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative flex-shrink-0 w-10 h-10">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <svg
                                    className="h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                                    />
                                  </svg>
                                </div>
                              )}
                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  onlineStatusMap[user.uuid] ? "bg-green-500" : "bg-gray-500"
                                }`}
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="font-semibold truncate whitespace-nowrap w-32">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate whitespace-nowrap w-32">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-28 text-right">
                            <button
                              disabled={
                                user.friendStatus === "pending" || user.friendStatus === "accepted"
                              }
                              onClick={() => handleSendFriendRequest(user.uuid)}
                              className={`px-3 py-1 text-sm whitespace-nowrap rounded ${
                                user.friendStatus === "accepted"
                                  ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                                  : user.friendStatus === "pending"
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                            >
                              {user.friendStatus === "accepted"
                                ? "친구"
                                : user.friendStatus === "pending"
                                ? "요청됨"
                                : "친구 요청"}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : loading ? (
              <p className="text-center text-gray-500 text-sm">불러오는 중...</p>
            ) : error ? (
              <p className="text-center text-red-500 text-sm">{error}</p>
            ) : friends.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">친구가 없습니다.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {friends.map((friend) => (
                  <li key={friend.uuid} className={liClass}>
                    <div
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => handleFriendClick(friend.uuid)}
                    >
                      <div className="relative flex-shrink-0 w-10 h-10">
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                              />
                            </svg>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            onlineStatusMap[friend.uuid] ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold truncate whitespace-nowrap w-32">
                          {friend.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate whitespace-nowrap w-32">
                          {friend.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-28 text-right">
                      <button
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => handleMessageClick(friend.uuid)}
                        title="채팅하기"
                      >
                        <Icons
                          name="chat"
                          className="w-6 h-6 text-gray-400 hover:text-blue-400 duration-300"
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {receivedRequests.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">받은 친구 요청이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {receivedRequests.map((req) => (
                  <li key={req.uuid} className={liClass}>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative flex-shrink-0 w-10 h-10">
                        {req.profilePicture ? (
                          <img
                            src={req.profilePicture}
                            alt={req.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                              />
                            </svg>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            onlineStatusMap[req.uuid] ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold truncate whitespace-nowrap w-32">{req.name}</p>
                        <p className="text-sm text-gray-500 truncate whitespace-nowrap w-32">
                          {req.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-28 text-right flex space-x-2">
                      <button
                        onClick={() => handleAccept(req.uuid)}
                        className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleDecline(req.uuid)}
                        className="px-2 py-1 text-sm bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      >
                        거절
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {activeTab === "list" && (
        <div className="p-4 border-t border-gray-100 text-right">
          <button
            onClick={handleToggleMode}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {isAdding ? "친구 목록" : "친구 추가"}
          </button>
        </div>
      )}

      {selectedFriendUuid && (
        <FriendProfileCard
          uuid={selectedFriendUuid}
          onClose={closeFriendProfile}
          onDeleted={() => {
            loadFriends();
            closeFriendProfile();
          }}
        />
      )}
    </div>
  );
};

export default FriendList;
