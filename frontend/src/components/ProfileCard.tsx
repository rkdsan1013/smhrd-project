// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useRef } from "react";
import { post } from "../services/apiClient";

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
  // 페이드 효과를 위한 상태
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달이 마운트될 때 짧은 지연 후 fade-in 효과 적용
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 모달 종료 시 fade-out 효과 후 onClose 호출
  const handleCloseWithFade = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // transition과 동일한 시간 설정
  };

  // 로그아웃 핸들러 (post 요청 후 사용자 로그아웃 이벤트 전파)
  const handleLogout = async () => {
    try {
      await post("/auth/logout", {});
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  // 모달은 항상 중앙에 고정
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
      ></div>
      {/* 모달 컨텐츠 */}
      <div
        ref={modalRef}
        className={`relative z-10 bg-white rounded-lg shadow-xl w-80 select-none transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={modalStyle}
      >
        {/* 헤더 (종료 버튼 포함) */}
        <div className="p-4 border-b border-gray-200 relative">
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <button
            onClick={handleCloseWithFade}
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-200"
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
        {/* 모달 내부 내용 */}
        <div className="p-4">
          <div className="flex items-center space-x-4 mt-4">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300" />
            )}
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
        </div>
        {/* 모달 최하단: 로그아웃 버튼 영역 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-300"
          >
            <svg
              className="w-6 h-6 text-gray-200"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
              />
            </svg>
            <span className="ml-2 text-gray-200">로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
