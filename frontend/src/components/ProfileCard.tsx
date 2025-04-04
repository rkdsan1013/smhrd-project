// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import { logout, changePassword, withdrawAccount } from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { validateName, validatePassword } from "../utils/validators";
import { useUserProfile } from "../contexts/UserProfileContext";
import Icons from "./Icons";

// 공통 스타일 클래스
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface ProfileCardProps {
  onClose: () => void;
}

const getDisplayGender = (gender?: string): string => {
  if (!gender) return "";
  return gender.toLowerCase() === "male"
    ? "남성"
    : gender.toLowerCase() === "female"
    ? "여성"
    : gender;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
  // Context 및 상태
  const { profile, loading, error, reloadProfile } = useUserProfile();

  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 프로필 수정 모드 여부
  const [isManagingAccount, setIsManagingAccount] = useState(false); // 계정 관리 화면 여부
  const [isChangingPassword, setIsChangingPassword] = useState(false); // 비밀번호 변경 모드 여부
  const [isWithdrawing, setIsWithdrawing] = useState(false); // 회원 탈퇴 모드 여부
  const [editedName, setEditedName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    profile?.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
  );
  const [formError, setFormError] = useState("");

  // 모달 높이 조절용 ref 및 마운트 상태
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Effects

  // 모달 fade-in 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 프로필 정보 갱신 (편집 모드가 아닐 때)
  useEffect(() => {
    if (profile && !isEditing) {
      setEditedName(profile.name);
      setProfilePreview(
        profile.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
      );
    }
  }, [profile, isEditing]);

  // 초기 마운트 후 높이 설정 (내부 컨텐츠 높이에 맞게 outerRef의 높이를 설정)
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 내용 변경에 따른 모달 높이 애니메이션 조절 (내부 컨텐츠에 따라 동적으로 높이 변화)
  useLayoutEffect(() => {
    if (outerRef.current && innerRef.current) {
      const newHeight = innerRef.current.offsetHeight;
      let currentHeight = parseFloat(getComputedStyle(outerRef.current).height || "0");
      if (oldHeightRef.current != null) {
        currentHeight = oldHeightRef.current;
        oldHeightRef.current = null;
      }
      if (Math.round(currentHeight) !== Math.round(newHeight)) {
        outerRef.current.style.transition = "none";
        outerRef.current.style.height = `${currentHeight}px`;
        outerRef.current.getBoundingClientRect();
        outerRef.current.style.transition = "height 0.3s ease-in-out";
        outerRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [hasMounted, isEditing, isChangingPassword, formError, isManagingAccount, isWithdrawing]);

  // Handlers

  // 비밀번호 변경 모드 취소 → 계정 관리 화면으로 복귀
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setIsManagingAccount(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setFormError("");
  };

  // 회원 탈퇴 모드 취소 → 계정 관리 화면으로 복귀
  const handleCancelWithdraw = () => {
    setIsWithdrawing(false);
    setIsManagingAccount(true);
    setWithdrawPassword("");
    setFormError("");
  };

  // 회원 탈퇴 API 호출 (입력값 검증 포함)
  const handleConfirmWithdraw = async () => {
    const passResult = validatePassword(withdrawPassword);
    if (!passResult.valid) {
      setFormError(passResult.message || "비밀번호가 유효하지 않습니다.");
      return;
    }
    try {
      const response = await withdrawAccount(withdrawPassword);
      if (response.success) {
        alert("회원 탈퇴 처리되었습니다.");
        await logout();
        window.dispatchEvent(new CustomEvent("userSignedOut"));
      } else {
        setFormError(response.message || "회원 탈퇴에 실패하였습니다.");
      }
    } catch (error: any) {
      setFormError(error.message || "회원 탈퇴 중 오류가 발생하였습니다.");
    }
  };

  // 프로필 사진 변경
  const onProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (formError) setFormError("");
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 프로필 편집 모드 진입
  const onEditProfile = () => {
    if (formError) setFormError("");
    if (outerRef.current) oldHeightRef.current = outerRef.current.offsetHeight;
    setIsEditing(true);
    setIsManagingAccount(false);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
    if (profile) {
      setEditedName(profile.name);
      setProfilePreview(
        profile.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
      );
    }
  };

  // 편집 모드 취소 → 읽기 모드 전환
  const onCancelEdit = () => {
    setIsEditing(false);
    setIsManagingAccount(false);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
    setProfilePicture(null);
    setFormError("");
    setWithdrawPassword("");
    setProfilePreview(
      profile?.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
    );
  };

  // 저장 처리 (비밀번호 변경 또는 프로필 업데이트)
  const onSaveEdit = async () => {
    if (!isEditing) return;

    if (isChangingPassword) {
      if (!currentPassword.trim()) {
        setFormError("현재 비밀번호를 입력해 주십시오.");
        return;
      }
      const passResult = validatePassword(newPassword);
      if (!passResult.valid) {
        setFormError(passResult.message || "새 비밀번호가 유효하지 않습니다.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setFormError("변경할 비밀번호가 서로 일치하지 않습니다.");
        return;
      }
      try {
        const response = await changePassword(currentPassword, newPassword);
        if (response.success) {
          alert("비밀번호가 변경되었습니다.");
          setIsChangingPassword(false);
          setIsManagingAccount(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setFormError("");
        } else {
          setFormError(response.message || "비밀번호 변경에 실패하였습니다.");
        }
      } catch (error: any) {
        setFormError(error.message || "비밀번호 변경 중 오류가 발생하였습니다.");
      }
    } else {
      const nameResult = validateName(editedName);
      if (!nameResult.valid) {
        setFormError(nameResult.message || "올바른 이름을 입력해 주십시오.");
        return;
      }
      const formData = new FormData();
      formData.append("name", editedName);
      if (profilePicture) formData.append("profilePicture", profilePicture);
      try {
        const resp = await updateUserProfile(formData);
        if (resp.success) {
          alert("프로필이 업데이트되었습니다.");
          setIsEditing(false);
          setProfilePicture(null);
          setFormError("");
          await reloadProfile();
        } else {
          setFormError("프로필 업데이트에 실패하였습니다.");
        }
      } catch (error: any) {
        setFormError(error.message || "업데이트 중 오류가 발생하였습니다.");
      }
    }
  };

  // 계정 관리 모드 진입
  const onManageAccount = () => {
    if (formError) setFormError("");
    setIsManagingAccount(true);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
  };

  // 계정 관리에서 비밀번호 변경 모드 전환
  const onChangePasswordFromAccount = () => {
    if (formError) setFormError("");
    setIsManagingAccount(false);
    setIsChangingPassword(true);
  };

  // 계정 관리에서 회원 탈퇴 모드 전환
  const onWithdraw = () => {
    if (formError) setFormError("");
    setIsWithdrawing(true);
  };

  // 계정 관리 화면 종료 (돌아가기)
  const onBackFromAccountManage = () => {
    if (formError) setFormError("");
    setIsManagingAccount(false);
    setIsWithdrawing(false);
  };

  // 모달 닫기
  const onCloseModal = () => {
    setIsVisible(false);
    setIsManagingAccount(false);
    setTimeout(onClose, 300);
  };

  const onLogout = async () => {
    try {
      await logout();
      onCloseModal();
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  // 렌더링
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Icons name="spinner" className="animate-spin h-8 w-8 text-gray-200 fill-blue-600" />
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
        onClick={onCloseModal}
      />

      {/* Modal */}
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
          <h2 className="text-xl font-bold">
            {!isEditing
              ? "프로필 정보"
              : isChangingPassword
              ? "비밀번호 변경"
              : isWithdrawing
              ? "회원 탈퇴"
              : isManagingAccount
              ? "계정 관리"
              : "프로필 수정"}
          </h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 flex flex-col items-center">
            {!isEditing ? (
              // 읽기 모드: 프로필 정보 표시
              <div className="w-full flex flex-col space-y-4 items-center">
                <div className="flex flex-col items-center">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  )}
                </div>
                <div className="w-full text-center">
                  <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.name}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                </div>
                <div className="w-full text-left">
                  {profile.birthdate && (
                    <p className="text-gray-600 truncate">생일: {profile.birthdate}</p>
                  )}
                  {profile.gender && (
                    <p className="text-gray-600 truncate">
                      성별: {getDisplayGender(profile.gender)}
                    </p>
                  )}
                  {Boolean(profile.paradoxFlag) && (
                    <p className="text-sm text-blue-500 truncate">
                      시간 여행은 오늘도 순조롭게 진행 중인가요?
                    </p>
                  )}
                </div>
              </div>
            ) : isEditing && isManagingAccount ? (
              // 계정 관리 모드 내 폼
              isWithdrawing ? (
                // 회원 탈퇴 폼
                <div className="w-full flex flex-col space-y-4 items-center text-center">
                  <p className="text-lg font-semibold">정말로 회원 탈퇴를 진행하시겠습니까?</p>
                  <div className="w-full relative">
                    <input
                      type="password"
                      value={withdrawPassword}
                      onChange={(e) => {
                        setWithdrawPassword(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label className={labelClass}>비밀번호 입력</label>
                  </div>
                </div>
              ) : (
                // 기본 계정 관리 폼
                <div className="w-full flex flex-col space-y-4 items-center text-center">
                  <div className="flex justify-center">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.name}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                  <div className="w-full flex flex-col space-y-2">
                    <button
                      onClick={onChangePasswordFromAccount}
                      className="h-10 w-full bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors text-white text-sm"
                    >
                      비밀번호 변경
                    </button>
                    <button
                      onClick={onWithdraw}
                      className="h-10 w-full bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white text-sm"
                    >
                      회원 탈퇴
                    </button>
                  </div>
                </div>
              )
            ) : isEditing && isChangingPassword ? (
              // 비밀번호 변경 폼
              <div className="w-full flex flex-col space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (formError) setFormError("");
                    }}
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
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formError) setFormError("");
                    }}
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
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (formError) setFormError("");
                    }}
                    className={baseInputClass}
                    placeholder=" "
                  />
                  <label htmlFor="confirmPassword" className={labelClass}>
                    비밀번호 확인
                  </label>
                </div>
              </div>
            ) : (
              // 기본 프로필 수정 폼
              <div className="w-full flex flex-col space-y-4 items-center">
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="profilePicture"
                    className="relative group w-24 h-24 rounded-full overflow-hidden"
                  >
                    <div className="w-full h-full">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="프로필 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full"></div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={onProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <div className="w-full text-center">
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={editedName}
                      onChange={(e) => {
                        setEditedName(e.target.value);
                        if (formError) setFormError("");
                      }}
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
                </div>
                <div className="w-full">
                  <button
                    onClick={onManageAccount}
                    className="h-10 w-full bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors text-white text-sm"
                  >
                    계정 관리
                  </button>
                </div>
              </div>
            )}
            {formError && <div className="w-full mt-2 text-red-500 text-sm">{formError}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 w-full">
          {!isEditing ? (
            // 읽기 모드: 두 개의 버튼이 grid-cols-2로 각각 50%씩 차지함
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-start">
                <button
                  onClick={onLogout}
                  className="h-10 w-10 bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-300 flex items-center justify-center"
                >
                  <Icons name="logout" className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={onEditProfile}
                  className="h-10 w-full bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center"
                >
                  <span className="text-white text-sm block text-center">프로필 수정</span>
                </button>
              </div>
            </div>
          ) : isEditing && isChangingPassword ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCancelPasswordChange}
                className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">취소</span>
              </button>
              <button
                onClick={onSaveEdit}
                className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm block">비밀번호 변경</span>
              </button>
            </div>
          ) : isEditing && isWithdrawing ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCancelWithdraw}
                className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">취소</span>
              </button>
              <button
                onClick={handleConfirmWithdraw}
                className="h-10 w-full bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-300"
              >
                <span className="text-white text-sm block">탈퇴</span>
              </button>
            </div>
          ) : isEditing && isManagingAccount ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onBackFromAccountManage}
                className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">돌아가기</span>
              </button>
              <div className="h-10 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onCancelEdit}
                className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">취소</span>
              </button>
              <button
                onClick={onSaveEdit}
                className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm block">저장</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
