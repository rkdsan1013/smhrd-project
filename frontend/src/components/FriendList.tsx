// /frontend/src/components/FriendList.tsx

import React, { useEffect, useState, useLayoutEffect, useRef, MouseEvent } from "react";
import ReactDOM from "react-dom";
import {
  searchUsers,
  SearchResultUser,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "../services/friendService";
import { openOrCreateDMRoom } from "../services/chatService";
import FriendProfileCard from "./FriendProfileCard";
import Icons from "./Icons";
import DirectMessage from "./DirectMessage";
import { useUser } from "../contexts/UserContext";
import { useSocket } from "../contexts/SocketContext";
import { useFriend } from "../contexts/FriendContext";

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

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
  const [selectedFriendUuid, setSelectedFriendUuid] = useState<string | null>(null);
  const [dmRoomUuid, setDmRoomUuid] = useState<string | null>(null);
  const [localOnlineStatus, setLocalOnlineStatus] = useState<Record<string, boolean>>({});

  const { friends, loading, error, loadFriends, friendRequests, loadFriendRequests, onlineStatus } =
    useFriend();
  const { userUuid } = useUser();
  const { socket } = useSocket();

  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const bodyContentRef = useRef<HTMLDivElement>(null);

  const liClass =
    "flex items-center justify-between h-14 px-3 py-2 rounded hover:bg-gray-100 transition-colors duration-300";

  // FriendContext의 온라인 상태를 로컬 state에 반영
  useEffect(() => {
    setLocalOnlineStatus(onlineStatus);
  }, [onlineStatus]);

  useEffect(() => {
    if (activeTab === "requests") {
      loadFriendRequests();
    }
  }, [activeTab, loadFriendRequests]);

  useEffect(() => {
    if (!socket) return;

    const handleFriendRequestReceived = () => {
      loadFriendRequests();
    };

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

    const handleUserOnlineStatus = ({ uuid, online }: { uuid: string; online: boolean }) => {
      setLocalOnlineStatus((prev) => ({ ...prev, [uuid]: online }));
    };

    const handleFriendsOnlineStatus = (statusList: { uuid: string; online: boolean }[]) => {
      const updated: Record<string, boolean> = {};
      statusList.forEach(({ uuid, online }) => {
        updated[uuid] = online;
      });
      setLocalOnlineStatus(updated);
    };

    socket.on("friendRequestReceived", handleFriendRequestReceived);
    socket.on("friendRequestResponded", handleFriendRequestResponded);
    socket.on("userOnlineStatus", handleUserOnlineStatus);
    socket.on("friendsOnlineStatus", handleFriendsOnlineStatus);

    return () => {
      socket.off("friendRequestReceived", handleFriendRequestReceived);
      socket.off("friendRequestResponded", handleFriendRequestResponded);
      socket.off("userOnlineStatus", handleUserOnlineStatus);
      socket.off("friendsOnlineStatus", handleFriendsOnlineStatus);
    };
  }, [socket]);

  if (dmRoomUuid && userUuid) {
    return (
      <DirectMessage
        roomUuid={dmRoomUuid}
        onBack={() => setDmRoomUuid(null)}
        currentUserUuid={userUuid}
      />
    );
  }

  useLayoutEffect(() => {
    if (bodyContainerRef.current && bodyContentRef.current) {
      const newHeight = bodyContentRef.current.offsetHeight;
      bodyContainerRef.current.style.transition = "height 0.3s ease-in-out";
      bodyContainerRef.current.style.height = `${newHeight}px`;
    }
  }, [activeTab, isAdding, searchResults, friends, friendRequests]);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    try {
      setSearchLoading(true);
      setSearchError("");
      const results = await searchUsers(searchKeyword);
      const sortedResults = [...results].sort((a, b) => {
        const weight = (status: string | null | undefined) => {
          if (!status) return 0;
          if (status === "pending") return 1;
          if (status === "accepted") return 2;
          return 3;
        };
        return weight(a.friendStatus) - weight(b.friendStatus);
      });
      setSearchResults(sortedResults);
    } catch (err: any) {
      setSearchError(err.message || "검색 실패");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleMode = () => {
    setActiveTab("list");
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
      await loadFriendRequests();
      await loadFriends();
      socket?.emit("getFriendsOnlineStatus");
    } catch (err: any) {
      alert(err.message || "수락 실패");
    }
  };

  const handleDecline = async (uuid: string) => {
    try {
      await declineFriendRequest(uuid);
      await loadFriendRequests();
    } catch (err: any) {
      alert(err.message || "거절 실패");
    }
  };

  const handleFriendClick = (uuid: string) => setSelectedFriendUuid(uuid);
  const closeFriendProfile = () => setSelectedFriendUuid(null);
  const handleMessageClick = async (friendUuid: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const roomUuid = await openOrCreateDMRoom(friendUuid);
      setDmRoomUuid(roomUuid);
    } catch (err) {
      alert("채팅방을 여는 데 실패했습니다.");
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-96 select-none">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">{isAdding ? "친구 추가" : "친구 목록"}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {/* 탭 네비게이션 */}
        {!isAdding && (
          <div className="relative border-b border-gray-200">
            <div className="flex gap-4 mb-2 px-4 pt-2">
              <button
                onClick={() => {
                  setActiveTab("list");
                  setIsAdding(false);
                }}
                className={`flex-1 text-sm py-2 transition-all duration-300 ${
                  activeTab === "list" ? "font-semibold text-blue-600" : "text-gray-500"
                }`}
              >
                <Icons name="users" className="w-5 h-5 inline-block mr-1" />
                친구 목록{friends.length > 0 ? ` (${friends.length})` : ""}
              </button>
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setIsAdding(false);
                }}
                className={`flex-1 text-sm py-2 transition-all duration-300 ${
                  activeTab === "requests" ? "font-semibold text-blue-600" : "text-gray-500"
                }`}
              >
                <Icons name="userGroup" className="w-5 h-5 inline-block mr-1" />
                친구 요청{friendRequests.length > 0 ? ` (${friendRequests.length})` : ""}
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
              style={{ left: activeTab === "list" ? "0%" : "50%", width: "50%" }}
            ></div>
          </div>
        )}
        {/* 본문 영역 */}
        <div ref={bodyContainerRef} className="overflow-hidden">
          <div ref={bodyContentRef} className="p-6">
            {activeTab === "list" ? (
              <>
                {isAdding ? (
                  <>
                    <div className="space-y-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            id="search-input"
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSearch();
                            }}
                            placeholder=" "
                            className={baseInputClass}
                          />
                          <label htmlFor="search-input" className={labelClass}>
                            이메일 또는 이름으로 검색
                          </label>
                        </div>
                        <button
                          onClick={handleSearch}
                          className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                        >
                          <Icons name="search" className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="h-60 overflow-y-auto pr-1 no-scrollbar">
                      {searchLoading ? (
                        <div className="flex justify-center">
                          <Icons name="spinner" className="animate-spin w-6 h-6 text-gray-500" />
                        </div>
                      ) : searchError ? (
                        <p className="text-center text-red-500">{searchError}</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm">검색 결과 없음</p>
                      ) : (
                        <ul className="space-y-2">
                          {searchResults.map((user) => (
                            <li
                              key={user.uuid}
                              className={liClass}
                              onClick={() => handleFriendClick(user.uuid)}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="relative flex-shrink-0 w-12 h-12">
                                  {user.profilePicture ? (
                                    <img
                                      src={user.profilePicture}
                                      alt={user.name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                  )}
                                  <span
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                      localOnlineStatus[user.uuid] ? "bg-green-500" : "bg-gray-500"
                                    }`}
                                  />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <p className="font-semibold truncate">{user.name}</p>
                                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendFriendRequest(user.uuid);
                                  }}
                                  disabled={
                                    user.friendStatus === "pending" ||
                                    user.friendStatus === "accepted"
                                  }
                                  className={`px-2 py-1 text-sm rounded whitespace-nowrap ${
                                    user.friendStatus === "accepted"
                                      ? "text-gray-400 cursor-not-allowed"
                                      : user.friendStatus === "pending"
                                      ? "text-gray-500 cursor-not-allowed"
                                      : "text-green-500 hover:text-green-600"
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
                  <div className="flex justify-center">
                    <Icons name="spinner" className="animate-spin w-6 h-6 text-gray-500" />
                  </div>
                ) : error ? (
                  <p className="text-center text-red-500 text-sm">{error}</p>
                ) : friends.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">친구가 없습니다.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                    {friends.map((friend) => (
                      <li
                        key={friend.uuid}
                        className={`${liClass} cursor-pointer transition-colors duration-300 hover:bg-gray-200`}
                        onClick={() => handleFriendClick(friend.uuid)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="relative flex-shrink-0 w-12 h-12">
                            {friend.profilePicture ? (
                              <img
                                src={friend.profilePicture}
                                alt={friend.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            )}
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                localOnlineStatus[friend.uuid] ? "bg-green-500" : "bg-gray-500"
                              }`}
                            />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="font-semibold truncate">{friend.name}</p>
                            <p className="text-sm text-gray-500 truncate">{friend.email}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2 text-right">
                          <button
                            onClick={(e) => handleMessageClick(friend.uuid, e)}
                            title="채팅하기"
                            className="p-1"
                            onMouseDown={(e) => e.stopPropagation()}
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
            ) : (
              <>
                {friendRequests.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">받은 친구 요청이 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {friendRequests.map((req) => (
                      <li key={req.uuid} className={liClass}>
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="relative flex-shrink-0 w-12 h-12">
                            {req.profilePicture ? (
                              <img
                                src={req.profilePicture}
                                alt={req.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            )}
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                localOnlineStatus[req.uuid] ? "bg-green-500" : "bg-gray-500"
                              }`}
                            />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="font-semibold truncate">{req.name}</p>
                            <p className="text-sm text-gray-500 truncate">{req.email}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2 text-right flex space-x-1">
                          <button
                            onClick={() => handleAccept(req.uuid)}
                            className="p-1 text-green-500 hover:text-green-600 transition"
                          >
                            <Icons name="check" className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleDecline(req.uuid)}
                            className="p-1 text-red-500 hover:text-red-600 transition"
                          >
                            <Icons name="close" className="w-6 h-6" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
        {/* 푸터 영역 */}
        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={() => {
              setActiveTab("list");
              handleToggleMode();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {isAdding ? (
              <>
                <Icons name="users" className="w-5 h-5 mr-1" />
                친구 목록
              </>
            ) : (
              <>
                <Icons name="userAdd" className="w-5 h-5 mr-1" />
                친구 추가
              </>
            )}
          </button>
        </div>
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
    </div>,
    document.body,
  );
};

export default FriendList;
