import React from "react";
import { useUserProfile } from "../hooks/useUserProfile";

const Footer: React.FC = () => {
  const { profile, loading, error } = useUserProfile();

  const handleFriendListClick = () => {
    alert("친구 목록으로 이동합니다.");
  };

  const handleProfileClick = () => {
    alert("프로필 상세 정보로 이동합니다.");
  };

  return (
    <footer className="bg-white rounded-lg shadow-lg p-3">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 클릭 가능한 프로필 카드 (단일 배경색 적용) */}
        <div
          onClick={handleProfileClick}
          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-100 hover:shadow-md transition duration-150"
        >
          {loading ? (
            <div className="text-gray-700 text-sm">Loading...</div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : profile ? (
            <>
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
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
  );
};

export default Footer;
