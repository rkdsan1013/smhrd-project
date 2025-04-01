// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect } from "react";
import { logout } from "../services/authService";

// 입력박스 기본 스타일 (플로팅 라벨 적용)
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent " +
  "focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 " +
  "transition-all duration-300 ease-in-out";

interface Profile {
  name: string;
  email: string;
  profile_picture?: string;
  birthdate?: string; // 'YYYY-MM-DD' 등 원하는 형식
  gender?: string; // 예: "남성", "여성", "기타"
}

interface ProfileCardProps {
  profile: Profile;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

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

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  // 편집 모드 전환: 프로필 수정 버튼 클릭 시
  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedName(profile.name);
  };

  // 편집 취소: 편집 모드와 비밀번호 변경 모드 종료
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  // 편집 저장: 실제 저장 로직은 구현 필요 (여기서는 임시 alert 후 종료)
  const handleSaveEdit = () => {
    alert("수정 내용이 저장되었습니다.");
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  // 비밀번호 변경 버튼 클릭: 입력란 보여주기
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
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

        {/* 내부 내용: 프로필 이미지, 이름, 이메일, 생일, 성별 */}
        <div className="p-4">
          <div className="flex items-center space-x-4 mt-4">
            {/* 프로필 이미지 영역 */}
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
            {/* 텍스트 영역 */}
            <div className="flex-1 min-w-0 relative">
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className={`${baseInputClass} peer`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    이름
                  </label>
                </div>
              ) : (
                <h2 className="text-xl font-bold truncate" title={profile.name}>
                  {profile.name}
                </h2>
              )}
              <p className="text-gray-600 truncate" title={profile.email}>
                {profile.email}
              </p>
              <p className="text-gray-600 truncate" title={`생일: ${profile.birthdate}`}>
                생일: {profile.birthdate}
              </p>
              <p className="text-gray-600 truncate" title={`성별: ${profile.gender}`}>
                성별: {profile.gender}
              </p>
            </div>
          </div>
        </div>

        {/* 편집 모드일 때, 비밀번호 변경 영역 */}
        {isEditing && (
          <div className="mt-4 px-4">
            {!isChangingPassword ? (
              <button
                onClick={handleChangePassword}
                className="w-full px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors duration-300 text-white text-sm"
              >
                비밀번호 변경
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`${baseInputClass} peer`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="currentPassword"
                    className="absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    현재 비밀번호
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${baseInputClass} peer`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="newPassword"
                    className="absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    변경할 비밀번호
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`${baseInputClass} peer`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    변경할 비밀번호 확인
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 하단: 버튼 영역 */}
        <div className="p-4 border-t border-gray-200">
          {isEditing ? (
            // 편집 모드일 때: 취소 버튼은 좌측, 저장 버튼은 우측에 배치
            <div className="flex justify-between items-center w-full">
              <button
                onClick={handleCancelEdit}
                className="flex items-center justify-center h-10 px-4 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm">취소</span>
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center justify-center h-10 px-4 bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">저장</span>
              </button>
            </div>
          ) : (
            // 편집 모드가 아닐 때: 좌측에는 로그아웃 버튼, 우측에는 프로필 수정 버튼
            <div className="flex justify-between items-center w-full">
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
              <button
                onClick={handleEditProfile}
                className="flex items-center justify-center h-10 px-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">프로필 수정</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
