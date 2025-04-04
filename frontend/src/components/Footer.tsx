import React, { useState } from "react";
import { useUserProfile } from "../contexts/UserProfileContext";
import { useUser } from "../contexts/UserContext"; // ✅ 추가
import ProfileCard from "./ProfileCard";
import Icons from "./Icons";
import FriendList from "./FriendList";

const Footer: React.FC = () => {
  const { profile, loading, error } = useUserProfile();
  const { requestCount } = useUser(); // ✅ 친구 요청 수 가져오기
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);

  const handleFriendListClick = () => {
    setShowFriendList(true);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const closeModal = () => {
    setShowProfileModal(false);
  };

  const closeFriendList = () => {
    setShowFriendList(false);
  };

  return (
    <div className="relative">
      {/* 친구 목록 컴포넌트 - Footer 위에 간격 두고 위치 */}
      {showFriendList && (
        <div className="absolute bottom-30 right-0 z-50">
          <FriendList onClose={closeFriendList} />
        </div>
      )}

      <footer className="bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 클릭 가능한 프로필 카드 */}
          <div
            onClick={handleProfileClick}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gray-100 hover:shadow-md transition duration-200"
          >
            {loading ? (
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

          {/* 오른쪽: 친구 목록 버튼 + 배지 */}
          <div className="relative inline-block">
            <button
              onClick={handleFriendListClick}
              title="친구 목록"
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition"
            >
              친구 목록
            </button>

            {/* ✅ 친구 요청 수 배지 표시 (우측 상단 겹쳐서) */}
            {requestCount > 0 && (
              <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                {requestCount}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* ProfileCard 모달 렌더링 */}
      {showProfileModal && profile && <ProfileCard onClose={closeModal} />}
    </div>
  );
};

export default Footer;
