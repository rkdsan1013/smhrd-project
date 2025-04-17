// /frontend/src/components/Footer.tsx

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useUserProfile } from "../contexts/UserProfileContext";
import { useFriend } from "../contexts/FriendContext";
import ProfileCard from "./ProfileCard";
import Icons from "./Icons";
import FriendList from "./FriendList";
import NotificationList from "./NotificationList";
import { useNotificationContext } from "../contexts/NotificationContext";

const Footer: React.FC = () => {
  const { profile, loading, error } = useUserProfile();
  const { friendRequests } = useFriend();
  const { notifications } = useNotificationContext();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleFriendListClick = () => setShowFriendList(true);
  const handleProfileClick = () => setShowProfileModal(true);
  const handleNotificationClick = () => setShowNotificationModal(true);

  const closeModal = () => setShowProfileModal(false);
  const closeFriendList = () => setShowFriendList(false);
  const closeNotificationModal = () => setShowNotificationModal(false);

  const notificationsCount = notifications.length;

  return (
    <div className="relative">
      {/* 친구 목록 */}
      {showFriendList && (
        <div className="absolute bottom-16 right-4 z-50">
          <FriendList onClose={closeFriendList} />
        </div>
      )}
      <footer className="bg-white rounded-lg border-t border-gray-200 shadow-lg p-4">
        <div className="flex items-center">
          {/* 프로필 카드 영역 */}
          <div
            onClick={handleProfileClick}
            className="flex items-center space-x-4 p-3 rounded-xl bg-white border border-gray-200 cursor-pointer transition-shadow duration-200 hover:shadow-xl overflow-hidden max-w-[300px]"
          >
            {loading ? (
              <Icons
                name="spinner"
                className="animate-spin w-10 h-10 text-gray-300 fill-blue-600"
              />
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : profile ? (
              <>
                {profile.profilePicture ? (
                  <img
                    src={`${profile.profilePicture}?v=${profile.version || ""}`}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                )}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                  <span className="font-semibold text-gray-800 truncate whitespace-nowrap">
                    {profile.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate whitespace-nowrap">
                    {profile.email}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-700 text-sm">프로필 정보가 없습니다.</div>
            )}
          </div>
          {/* 알림 버튼과 친구 목록 버튼 그룹 */}
          <div className="flex items-center ml-auto space-x-2">
            {/* 알림 버튼 */}
            <div className="relative flex-shrink-0">
              <button
                onClick={handleNotificationClick}
                title="알림"
                className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none overflow-hidden"
              >
                <Icons name={notificationsCount > 0 ? "bellActive" : "bell"} className="w-6 h-6" />
              </button>
              {notificationsCount > 0 && (
                <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md z-20">
                  {notificationsCount}
                </span>
              )}
            </div>
            {/* 친구 목록 버튼 */}
            <div className="relative flex-shrink-0">
              <button
                onClick={handleFriendListClick}
                title="친구 목록"
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none overflow-hidden"
              >
                <Icons name="users" className="w-6 h-6 text-white" />
                <span className="hidden md:inline-block ml-2 font-medium truncate whitespace-nowrap max-w-[120px]">
                  친구 목록
                </span>
              </button>
              {friendRequests.length > 0 && (
                <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                  {friendRequests.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
      {/* 알림 모달 */}
      {showNotificationModal && <NotificationList onClose={closeNotificationModal} />}
      {/* 프로필 카드 모달 */}
      {showProfileModal &&
        profile &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <ProfileCard onClose={closeModal} />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Footer;
