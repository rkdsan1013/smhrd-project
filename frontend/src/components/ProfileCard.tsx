// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { logout } from "../services/authService";
import { useUserProfile } from "../hooks/useUserProfile";

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface ProfileCardProps {
  onClose: () => void;
}

const getDisplayGender = (gender?: string): string => {
  if (!gender) return "";
  const lower = gender.toLowerCase();
  return lower === "male" ? "남성" : lower === "female" ? "여성" : gender;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
  const { profile, loading, error } = useUserProfile();
  const [isVisible, setIsVisible] = useState(false); // 전체 모달 fade-in용
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // 프로필 사진 업로드 관련 state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    profile && profile.profilePicture ? profile.profilePicture : null,
  );

  // 동적 본문 높이 애니메이션용 refs
  const cardOuterRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 모달 fade-in (50ms 후)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 프로필 로드시 초기값 설정
  useEffect(() => {
    if (profile && !isEditing) {
      setEditedName(profile.name);
      if (!profilePreview && typeof profile.profilePicture === "string") {
        setProfilePreview(profile.profilePicture);
      }
    }
  }, [profile, isEditing, profilePreview]);

  // 초기 마운트 시, 동적 영역(outer)의 높이를 inner의 높이로 설정 및 transition 적용
  useEffect(() => {
    if (cardOuterRef.current && cardInnerRef.current) {
      const newHeight = cardInnerRef.current.offsetHeight;
      cardOuterRef.current.style.height = `${newHeight}px`;
      cardOuterRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 동적 콘텐츠 변경 시 outer의 높이 업데이트 (애니메이션 적용)
  useLayoutEffect(() => {
    const outer = cardOuterRef.current;
    const inner = cardInnerRef.current;
    if (!outer || !inner) return;
    const newHeight = inner.offsetHeight;
    let currentHeight = parseFloat(getComputedStyle(outer).height || "0");
    if (oldHeightRef.current !== null) {
      currentHeight = oldHeightRef.current;
      oldHeightRef.current = null;
    }
    if (Math.round(currentHeight) === Math.round(newHeight)) return;
    outer.style.transition = "none";
    outer.style.height = `${currentHeight}px`;
    outer.getBoundingClientRect();
    outer.style.transition = "height 0.3s ease-in-out";
    outer.style.height = `${newHeight}px`;
  }, [hasMounted, isEditing, isChangingPassword]);

  // 파일 선택 처리 (프로필 사진 변경)
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 편집 모드 전환 전, outer의 이전 높이 저장 후 상태 업데이트
  const handleEditProfile = () => {
    if (cardOuterRef.current) {
      oldHeightRef.current = cardOuterRef.current.offsetHeight;
    }
    setTimeout(() => {
      setIsEditing(true);
      if (profile) setEditedName(profile.name);
    }, 0);
  };

  // 취소 시 편집 및 업로드 내역 초기화
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
    setProfilePicture(null);
    setProfilePreview(profile ? profile.profilePicture ?? null : null);
  };

  // 저장 시 편집 종료 및 업로드 내역 초기화
  const handleSaveEdit = () => {
    alert(isChangingPassword ? "비밀번호가 변경되었습니다." : "수정 내용이 저장되었습니다.");
    setIsEditing(false);
    setIsChangingPassword(false);
    setProfilePicture(null);
    setProfilePreview(profile ? profile.profilePicture ?? null : null);
  };

  // 비밀번호 변경 선택 시 편집 내역 초기화 후 비밀번호 입력란 활성화
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setProfilePicture(null);
    setProfilePreview(profile ? profile.profilePicture ?? null : null);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-red-500">{error}</div>
    );
  }
  if (!profile) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      {/* Modal Container */}
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
        {/* Header */}
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
        {/* Dynamic Content Area (Outer/Inner for height animation) */}
        <div ref={cardOuterRef} style={{ overflow: "hidden" }}>
          <div ref={cardInnerRef} className="p-6 flex flex-col items-center">
            {/* Profile Picture Area */}
            <div className="mb-6 flex flex-col items-center">
              {isEditing && !isChangingPassword ? (
                <>
                  <label
                    htmlFor="profilePicture"
                    className="relative group cursor-pointer w-24 h-24 mb-2 rounded-full overflow-hidden"
                  >
                    <div className="w-full h-full">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="프로필 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                          <svg
                            className="h-6 w-6 text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M13 10a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H14a1 1 0 0 1-1-1Z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12c0 .556-.227 1.06-.593 1.422A.999.999 0 0 1 20.5 20H4a2.002 2.002 0 0 1-2-2V6Zm6.892 12 3.833-5.356-3.99-4.322a1 1 0 0 0-1.549.097L4 12.879V6h16v9.95l-3.257-3.619a1 1 0 0 0-1.557.088L11.2 18H8.892Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"
                        />
                      </svg>
                    </div>
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="w-24 h-24 mb-4">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M13 10a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H14a1 1 0 0 1-1-1Z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12c0 .556-.227 1.06-.593 1.422A.999.999 0 0 1 20.5 20H4a2.002 2.002 0 0 1-2-2V6Zm6.892 12 3.833-5.356-3.99-4.322a1 1 0 0 0-1.549.097L4 12.879V6h16v9.95l-3.257-3.619a1 1 0 0 0-1.557.088L11.2 18H8.892Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Name & Email Area */}
            <div className="w-full text-center mb-4">
              {isEditing && !isChangingPassword ? (
                <>
                  <div className="relative mb-1">
                    <input
                      type="text"
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label htmlFor="name" className={labelClass}>
                      이름
                    </label>
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.name}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                </>
              )}
            </div>
            {/* 비밀번호 변경 버튼 (편집 모드에서, 비밀번호 변경 입력란이 활성화되지 않은 경우) */}
            {isEditing && !isChangingPassword && (
              <div className="w-full mt-4">
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors duration-300 text-white text-sm"
                >
                  비밀번호 변경
                </button>
              </div>
            )}
            {/* Password Change Section (편집 모드에서, 비밀번호 변경 입력란 활성화된 경우) */}
            {isEditing && isChangingPassword && (
              <div className="w-full mt-4">
                <div className="w-full space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label htmlFor="currentPassword" className={labelClass}>
                      현재 비밀번호
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label htmlFor="newPassword" className={labelClass}>
                      변경할 비밀번호
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label htmlFor="confirmPassword" className={labelClass}>
                      변경할 비밀번호 확인
                    </label>
                  </div>
                </div>
              </div>
            )}
            {/* Birthdate, Gender, paradoxFlag (편집 모드에서는 숨김) */}
            {!isEditing && (
              <div className="w-full text-left mt-4">
                {profile.birthdate && (
                  <p className="text-gray-600 truncate">생일: {profile.birthdate}</p>
                )}
                {profile.gender && (
                  <p className="text-gray-600 truncate">성별: {getDisplayGender(profile.gender)}</p>
                )}
                {profile.paradoxFlag && (
                  <p className="text-sm text-blue-500 truncate">시간여행은 순조로우신가요?</p>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
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
                <span className="text-white text-sm block">
                  {isChangingPassword ? "비밀번호 변경" : "저장"}
                </span>
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
