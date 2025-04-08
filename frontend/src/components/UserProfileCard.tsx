// /frontend/src/components/UserProfileCard.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { getUserProfileWithStatus } from "../services/userService";
import { sendFriendRequest, cancelFriendRequest, deleteFriend } from "../services/friendService";
import { useUser } from "../contexts/UserContext";
import { useFriend } from "../contexts/FriendContext";
import { useSocket } from "../contexts/SocketContext";

interface UserProfileCardProps {
  targetUuid: string;
  onClose: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ targetUuid, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { userUuid } = useUser();
  const { loadFriends, loadFriendRequests } = useFriend();
  const { socket } = useSocket();

  useEffect(() => {
    setIsVisible(true);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refreshProfile = () => {
      loadProfile();
    };

    socket.on("friendRequestCancelled", refreshProfile);
    socket.on("friendRemoved", refreshProfile);
    socket.on("friendRequestResponded", refreshProfile);
    socket.on("friendRequestReceived", refreshProfile);

    const handleFriendRequestSent = ({ to }: { to: string }) => {
      if (to === userUuid) refreshProfile();
    };
    socket.on("friendRequestSent", handleFriendRequestSent);

    return () => {
      socket.off("friendRequestCancelled", refreshProfile);
      socket.off("friendRemoved", refreshProfile);
      socket.off("friendRequestResponded", refreshProfile);
      socket.off("friendRequestReceived", refreshProfile);
      socket.off("friendRequestSent", handleFriendRequestSent);
    };
  }, [socket, targetUuid, userUuid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfileWithStatus(targetUuid);
      console.log("✅ 받아온 프로필:", res);
      setProfile(res);
      setError("");
    } catch (err: any) {
      console.error("❌ 프로필 로딩 실패:", err);
      setError(err.message || "프로필 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAction = async () => {
    if (!profile) return;

    try {
      if (profile.friendStatus === "accepted") {
        await deleteFriend(targetUuid);
        socket?.emit("friendRemoved", { removedUuid: userUuid });
        await loadFriends();
      } else if (profile.friendStatus === "pending") {
        if (profile.friendRequester === userUuid) {
          await cancelFriendRequest(targetUuid);
          socket?.emit("friendRequestCancelled", { from: userUuid, to: targetUuid });
        }
        await loadFriendRequests();
      } else {
        await sendFriendRequest(targetUuid);
        socket?.emit("friendRequestSent", { from: userUuid, to: targetUuid });
      }

      await loadFriends();
      await loadFriendRequests();
      await loadProfile(); // UI 상태 최신화를 위해
    } catch (err: any) {
      alert(err.message || "처리에 실패했습니다.");
    }
  };

  const getActionLabel = () => {
    if (!profile) return "";
    if (profile.friendStatus === "accepted") return "친구 삭제";
    if (profile.friendStatus === "pending") {
      if (profile.friendRequester === userUuid) return "요청 취소";
      return "요청 받음";
    }
    return "친구 요청";
  };

  const isActionDisabled = () => {
    return profile?.friendStatus === "pending" && profile?.friendRequester !== userUuid;
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-9999">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {loading ? (
            <Icons
              name="spinner"
              className="animate-spin w-6 h-6 text-gray-300 fill-blue-500 mx-auto"
            />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-2">
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-300"></div>
                )}
                <div className="w-full text-center">
                  {/* 이름과 이메일을 한 줄에 표시하고, 길 경우 '...'으로 생략 */}
                  <p className="font-semibold text-lg truncate w-full">{profile?.name}</p>
                  <p className="text-gray-500 text-sm truncate w-full">{profile?.email}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="p-4 border-t border-gray-200">
            {profile?.friendStatus === "accepted" ? (
              // 친구 삭제 버튼: 좌측 정렬, 아이콘 크기에 맞춘 정사각형 버튼
              <div className="flex justify-start">
                <button
                  onClick={handleAction}
                  className="h-10 w-10 rounded-lg transition-colors duration-300 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                >
                  <Icons name="userRemove" className="w-6 h-6" />
                </button>
              </div>
            ) : (
              // 그 외는 기존의 전체 너비 버튼
              <button
                onClick={handleAction}
                disabled={isActionDisabled()}
                className={`h-10 w-full rounded-lg transition-colors duration-300 ${
                  profile?.friendStatus === "pending" && profile?.friendRequester === userUuid
                    ? "bg-gray-300 hover:bg-gray-400 text-gray-800"
                    : profile?.friendStatus === "pending"
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {getActionLabel()}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default UserProfileCard;
