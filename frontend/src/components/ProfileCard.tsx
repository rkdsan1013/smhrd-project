// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect } from "react";
import { logout } from "../services/authService";

interface Profile {
  name: string;
  email: string;
  profile_picture?: string;
}

interface ProfileCardProps {
  profile: Profile;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 모달 마운트 시 fade-in 효과 적용
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // fade-out 효과 후 모달 닫기
  const handleCloseWithFade = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  // 프로필 수정 (편집모드 전환) 핸들러
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // 취소 버튼: 편집 모드 종료
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 저장 버튼: 실제 저장 로직은 필요에 따라 구현, 여기서는 임시 alert 후 편집 모드 종료
  const handleSaveEdit = () => {
    alert("수정 내용이 저장되었습니다.");
    setIsEditing(false);
  };

  // 모달 중앙 배치를 위한 인라인 스타일
  const modalStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    position: "absolute",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 반투명 오버레이 */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 bg-black/60 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleCloseWithFade}
      />
      {/* 모달 컨텐츠 */}
      <div
        className={`relative z-10 bg-white rounded-lg shadow-xl w-80 select-none transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={modalStyle}
      >
        {/* 헤더: 타이틀과 닫기 버튼 */}
        <div className="p-4 border-b border-gray-200 relative">
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <button
            onClick={handleCloseWithFade}
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내부 내용: 프로필 이미지, 이름, 이메일 */}
        <div className="p-4">
          <div className="flex items-center space-x-4 mt-4">
            {/* 이미지 영역 (크기 고정) */}
            <div className="flex-shrink-0">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300" />
              )}
            </div>
            {/* 텍스트 영역: 이름, 이메일 (길면 truncate 처리) */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate" title={profile.name}>
                {profile.name}
              </h2>
              <p className="text-gray-600 truncate" title={profile.email}>
                {profile.email}
              </p>
            </div>
          </div>
        </div>

        {/* 최하단: 좌우 버튼 배치 */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          {/* 좌측: 로그아웃 버튼 (아이콘만, 고정 높이 h-10, w-10) */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center h-10 w-10 bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
              />
            </svg>
          </button>

          {/* 우측: 편집 관련 버튼 영역 */}
          {isEditing ? (
            <div className="flex space-x-2">
              {/* 취소 버튼: 회색 계열 */}
              <button
                onClick={handleCancelEdit}
                className="flex items-center justify-center h-10 px-4 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm">취소</span>
              </button>
              {/* 저장 버튼: 초록색 계열 */}
              <button
                onClick={handleSaveEdit}
                className="flex items-center justify-center h-10 px-4 bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">저장</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditProfile}
              className="flex items-center justify-center h-10 px-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300"
            >
              <span className="text-white text-sm">프로필 수정</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
