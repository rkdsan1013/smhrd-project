// /frontend/src/components/Footer.tsx
import React, { useState } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import ProfileCard from "./ProfileCard";
import FriendList from "./FriendList"; // 친구 모달 컴포넌트 import

const Footer: React.FC = () => {
  const { profile, loading, error } = useUserProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendListModal, setShowFriendListModal] = useState(false);

  const handleFriendListClick = () => {
    setShowFriendListModal(true);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  const closeFriendListModal = () => {
    setShowFriendListModal(false);
  };

  return (
    <>
      <footer className="bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 클릭 가능한 프로필 카드 */}
          <div
            onClick={handleProfileClick}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-100 hover:shadow-md transition duration-200"
          >
            {loading ? (
              <div className="text-gray-700 text-sm">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : profile ? (
              <>
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                )}
                <div className="text-gray-700 text-sm">
                  <div className="font-semibold">{profile.name}</div>
                  <div className="text-xs">{profile.email}</div>
                </div>
              </>
            ) : (
              <div className="text-gray-700 text-sm">프로필 정보가 없습니다.</div>
            )}
          </div>

          {/* 오른쪽: 친구 목록 버튼 + 모달 */}
          <div className="relative">
            <button
              onClick={handleFriendListClick}
              title="친구 목록"
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition"
            >
              친구 목록
            </button>

            {/* 버튼 위에 띄우는 모달 */}
            {showFriendListModal && (
              <div className="absolute bottom-full right-0 mb-4 z-50">
                <FriendList onClose={closeFriendListModal} />
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* ProfileCard 모달 렌더링 (프로필 정보가 있을 경우에만) */}
      {showProfileModal && profile && <ProfileCard onClose={closeProfileModal} />}
    </>
  );
};

export default Footer;
