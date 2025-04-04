// /frontend/src/components/Footer.tsx
import React, { useState } from "react";
import { useUserProfile } from "../contexts/UserProfileContext";
import ProfileCard from "./ProfileCard";
import Icons from "./Icons";

const Footer: React.FC = () => {
  const { profile, loading, error } = useUserProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleFriendListClick = () => {
    alert("친구 목록으로 이동합니다.");
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const closeModal = () => {
    setShowProfileModal(false);
  };

  return (
    <>
      <footer className="bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 클릭 가능한 프로필 카드 */}
          <div
            onClick={handleProfileClick}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:shadow-md transition duration-200"
          >
            {loading ? (
              // 로딩 중에는 텍스트 대신 스피너 아이콘을 표시함.
              <Icons name="spinner" className="animate-spin w-8 h-8 text-gray-200 fill-blue-600" />
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
                <div className="text-gray-700 text-sm">
                  <div className="font-semibold">{profile.name}</div>
                  <div className="text-xs">{profile.email}</div>
                </div>
              </>
            ) : (
              <div className="text-gray-700 text-sm">프로필 정보가 없습니다.</div>
            )}
          </div>

          {/* 오른쪽: 친구 목록 버튼 */}
          <div>
            <button
              onClick={handleFriendListClick}
              title="친구 목록"
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition"
            >
              친구 목록
            </button>
          </div>
        </div>
      </footer>

      {/* ProfileCard 모달 렌더링 (프로필 정보가 있을 경우) */}
      {showProfileModal && profile && <ProfileCard onClose={closeModal} />}
    </>
  );
};

export default Footer;
