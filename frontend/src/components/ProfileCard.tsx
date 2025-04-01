// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect } from "react";
import { logout } from "../services/authService";

const baseInputClass =
  "peer block w-full border-b border-gray-300 pb-2 pt-4 bg-transparent text-base focus:outline-none focus:border-blue-600 transition duration-300 ease-in-out";

interface Profile {
  email: string;
  name: string;
  gender?: string;
  birthdate?: string;
  paradoxFlag?: boolean;
  profilePicture?: string;
}

interface ProfileCardProps {
  profile: Profile;
  onClose: () => void;
}

const getDisplayGender = (gender?: string): string => {
  if (!gender) return "";
  const lower = gender.toLowerCase();
  if (lower === "male") return "남성";
  if (lower === "female") return "여성";
  return gender;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // 모달 fade-in 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 모달 닫기
  const handleClose = () => {
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

  // 편집 모드 전환
  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedName(profile.name);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  // 프로필 저장
  const handleSaveEdit = () => {
    alert("수정 내용이 저장되었습니다.");
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  // 비밀번호 변경 영역 표시
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* 모달 */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 select-none transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          position: "absolute",
        }}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
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

        {/* 본문 */}
        <div className="p-6 flex flex-col items-center">
          {/* 아바타 */}
          <div className="w-24 h-24 mb-4">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full" />
            )}
          </div>
          {/* 이름과 이메일 (각각 별도 행, 중앙 정렬, 말줄임 처리) */}
          <div className="w-full text-center mb-4">
            {isEditing ? (
              <>
                <div className="relative mb-1">
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
                    className="absolute left-0 top-4 text-sm text-gray-500 origin-top-left transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    이름
                  </label>
                </div>
                <div className="text-gray-600 overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {profile.email}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {profile.name}
                </div>
                <div className="text-gray-600 overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {profile.email}
                </div>
              </>
            )}
          </div>
          {/* 생일과 성별 (왼쪽 정렬) */}
          <div className="w-full text-left mt-4">
            {profile.birthdate && (
              <p className="text-gray-600 truncate">생일: {profile.birthdate}</p>
            )}
            {profile.gender && (
              <p className="text-gray-600 truncate">성별: {getDisplayGender(profile.gender)}</p>
            )}
            {Boolean(profile.paradoxFlag) && (
              <p className="text-sm text-blue-500 truncate">시간여행은 순조로우신가요?</p>
            )}
          </div>

          {/* 비밀번호 변경 영역 */}
          {isEditing && (
            <div className="w-full mt-4">
              {!isChangingPassword ? (
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors duration-300 text-white text-sm"
                >
                  비밀번호 변경
                </button>
              ) : (
                <div className="w-full space-y-3">
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
                      className="absolute left-0 top-4 text-sm text-gray-500 origin-top-left transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
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
                      className="absolute left-0 top-4 text-sm text-gray-500 origin-top-left transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
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
                      className="absolute left-0 top-4 text-sm text-gray-500 origin-top-left transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                    >
                      변경할 비밀번호 확인
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 w-full">
          {isEditing ? (
            <div className="flex justify-between">
              <button
                onClick={handleCancelEdit}
                className="flex-1 mr-2 h-10 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">취소</span>
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 ml-2 h-10 bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm block">저장</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-between">
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
