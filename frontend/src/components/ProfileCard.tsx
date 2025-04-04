// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import { logout, changePassword, withdrawAccount } from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { validateName, validatePassword } from "../utils/validators";
import { useUserProfile } from "../contexts/UserProfileContext";
import Icons from "./Icons";

// 기본 스타일
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

// 타입 및 유틸 함수
interface ProfileCardProps {
  onClose: () => void;
}

type Mode = "view" | "manage" | "withdraw" | "changePassword" | "edit";

const getDisplayGender = (gender?: string): string => {
  if (!gender) return "";
  const lower = gender.toLowerCase();
  return lower === "male" ? "남성" : lower === "female" ? "여성" : gender;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
  const { profile, loading, error, reloadProfile } = useUserProfile();

  // 상태 변수들
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingAccount, setIsManagingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
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

  // 모달 높이 조절용 ref
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 수정폼 초기화
  const resetEditForm = () => {
    if (profile) {
      setEditedName(profile.name);
      setProfilePicture(null);
      setProfilePreview(
        profile.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
      );
      setFormError("");
    }
  };

  // --- 이펙트 ---
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (profile && !isEditing) {
      setEditedName(profile.name);
      setProfilePreview(
        profile.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
      );
    }
  }, [profile, isEditing]);
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);
  useLayoutEffect(() => {
    if (outerRef.current && innerRef.current) {
      const newHeight = innerRef.current.offsetHeight;
      let currentHeight = parseFloat(getComputedStyle(outerRef.current).height || "0");
      if (oldHeightRef.current !== null) {
        currentHeight = oldHeightRef.current;
        oldHeightRef.current = null;
      }
      if (Math.round(currentHeight) !== Math.round(newHeight)) {
        outerRef.current.style.transition = "none";
        outerRef.current.style.height = `${currentHeight}px`;
        outerRef.current.getBoundingClientRect(); // reflow
        outerRef.current.style.transition = "height 0.3s ease-in-out";
        outerRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [hasMounted, isEditing, isChangingPassword, formError, isManagingAccount, isWithdrawing]);

  // --- 키 입력 처리 ---
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "withdraw") {
        handleConfirmWithdraw();
      } else if (mode === "changePassword" || mode === "edit") {
        onSaveEdit();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (mode === "withdraw") {
        handleCancelWithdraw();
      } else if (mode === "changePassword") {
        handleCancelPasswordChange();
      } else if (mode === "edit") {
        onCancelEdit();
      }
    }
  };

  // --- 핸들러 ---
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setIsManagingAccount(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setFormError("");
  };

  const handleCancelWithdraw = () => {
    setIsWithdrawing(false);
    setIsManagingAccount(true);
    setWithdrawPassword("");
    setFormError("");
  };

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

  const onProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      formError && setFormError("");
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onEditProfile = () => {
    formError && setFormError("");
    if (outerRef.current) oldHeightRef.current = outerRef.current.offsetHeight;
    // 프로필 수정 모드로 전환 (계정 관리와 별도)
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

  // 필 수정 폼 취소 → 뷰 모드로 복귀
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
      return;
    }
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
  };

  // 뷰 모드의 계정 관리 버튼: 계정 관리 화면으로 전환
  const onManageAccount = () => {
    formError && setFormError("");
    resetEditForm();
    setIsEditing(true);
    setIsManagingAccount(true);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
  };

  const onChangePasswordFromAccount = () => {
    formError && setFormError("");
    setIsManagingAccount(false);
    setIsChangingPassword(true);
  };

  const onWithdraw = () => {
    formError && setFormError("");
    setIsWithdrawing(true);
  };

  // 계정 관리 화면 '돌아가기' → 뷰 모드 복귀
  const onBackFromAccountManage = () => {
    formError && setFormError("");
    setIsManagingAccount(false);
    setIsWithdrawing(false);
    setIsEditing(false);
  };

  // 모달 종료 시 모든 편집 상태 초기화
  const onCloseModal = () => {
    setIsVisible(false);
    setIsEditing(false);
    setIsManagingAccount(false);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
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

  // 모드 산출
  const mode: Mode = !isEditing
    ? "view"
    : isManagingAccount
    ? isWithdrawing
      ? "withdraw"
      : "manage"
    : isChangingPassword
    ? "changePassword"
    : "edit";

  const modalTitle = () => {
    switch (mode) {
      case "view":
        return "프로필 정보";
      case "changePassword":
        return "비밀번호 변경";
      case "withdraw":
        return "회원 탈퇴";
      case "manage":
        return "계정 관리";
      case "edit":
      default:
        return "프로필 수정";
    }
  };

  // --- 렌더링 헬퍼 ---
  const renderImage = (sizeClasses = "w-24 h-24") => {
    return profilePreview ? (
      <img
        src={profilePreview}
        alt={profile?.name}
        className={`${sizeClasses} rounded-full object-cover`}
      />
    ) : (
      <div className={`${sizeClasses} bg-gray-200 rounded-full`} />
    );
  };

  const renderBody = () => {
    switch (mode) {
      case "view":
        return (
          <div className="w-full flex flex-col space-y-4 items-center">
            <div className="flex flex-col items-center">{renderImage()}</div>
            <div className="w-full text-center">
              <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                {profile?.name}
              </div>
              <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                {profile?.email}
              </div>
            </div>
            <div className="w-full text-left">
              {profile?.birthdate && (
                <p className="text-gray-600 truncate">생일: {profile.birthdate}</p>
              )}
              {profile?.gender && (
                <p className="text-gray-600 truncate">성별: {getDisplayGender(profile.gender)}</p>
              )}
              {profile?.paradoxFlag && (
                <p className="text-sm text-blue-500 truncate">
                  시간 여행은 오늘도 순조롭게 진행 중인가요?
                </p>
              )}
            </div>
          </div>
        );
      case "manage":
        return (
          <div className="w-full flex flex-col space-y-4 items-center text-center">
            <div className="flex justify-center">{renderImage()}</div>
            <div className="w-full text-center">
              <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                {profile?.name}
              </div>
              <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                {profile?.email}
              </div>
            </div>
            <div className="w-full flex flex-col gap-1">
              <button
                onClick={onChangePasswordFromAccount}
                className="h-10 w-full bg-indigo-500 rounded-lg hover:bg-indigo-600 text-white text-sm"
              >
                비밀번호 변경
              </button>
              {/* 회원 탈퇴 텍스트: 좌측 정렬 */}
              <div className="w-full text-left">
                <span
                  onClick={onWithdraw}
                  className="text-xs text-red-500 underline cursor-pointer"
                >
                  회원 탈퇴
                </span>
              </div>
            </div>
          </div>
        );
      case "withdraw":
        return (
          <div
            className="w-full flex flex-col space-y-4 items-center text-left"
            tabIndex={0}
            onKeyDown={handleFormKeyDown}
          >
            <p className="text-lg font-semibold">정말로 회원 탈퇴를 진행하시겠습니까?</p>
            <div className="w-full relative">
              <input
                type="password"
                value={withdrawPassword}
                onChange={(e) => {
                  setWithdrawPassword(e.target.value);
                  formError && setFormError("");
                }}
                className={baseInputClass}
                placeholder=" "
              />
              <label className={labelClass}>비밀번호 입력</label>
            </div>
          </div>
        );
      case "changePassword":
        return (
          <div
            className="w-full flex flex-col space-y-4"
            tabIndex={0}
            onKeyDown={handleFormKeyDown}
          >
            <div className="relative">
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  formError && setFormError("");
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
                  formError && setFormError("");
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
                  formError && setFormError("");
                }}
                className={baseInputClass}
                placeholder=" "
              />
              <label htmlFor="confirmPassword" className={labelClass}>
                비밀번호 확인
              </label>
            </div>
          </div>
        );
      case "edit":
        return (
          <div
            className="w-full flex flex-col space-y-4 items-center"
            tabIndex={0}
            onKeyDown={handleFormKeyDown}
          >
            <div className="flex flex-col items-center">
              <label
                htmlFor="profilePicture"
                className="relative group w-24 h-24 rounded-full overflow-hidden"
              >
                <div className="w-full h-full">{renderImage()}</div>
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
                    formError && setFormError("");
                  }}
                  className={baseInputClass}
                  placeholder=" "
                />
                <label htmlFor="name" className={labelClass}>
                  이름
                </label>
              </div>
              <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                {profile?.email}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // --- 푸터 렌더링 ---
  const renderFooter = () => {
    switch (mode) {
      case "view":
        return (
          <div className="flex justify-start items-center gap-2">
            <button
              onClick={onLogout}
              className="h-10 w-10 bg-red-500 rounded-lg hover:bg-red-600 flex items-center justify-center"
            >
              <Icons name="logout" className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onManageAccount}
              className="h-10 w-10 bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center justify-center"
            >
              <Icons name="userSettings" className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onEditProfile}
              className="h-10 w-10 bg-green-500 rounded-lg hover:bg-green-600 flex items-center justify-center"
            >
              <Icons name="userEdit" className="w-6 h-6 text-white" />
            </button>
          </div>
        );
      case "changePassword":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancelPasswordChange}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <span className="text-gray-800 text-sm">취소</span>
            </button>
            <button
              onClick={onSaveEdit}
              className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600"
            >
              <span className="text-white text-sm">비밀번호 변경</span>
            </button>
          </div>
        );
      case "withdraw":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancelWithdraw}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <span className="text-gray-800 text-sm">취소</span>
            </button>
            <button
              onClick={handleConfirmWithdraw}
              className="h-10 w-full bg-red-500 rounded-lg hover:bg-red-600"
            >
              <span className="text-white text-sm">탈퇴</span>
            </button>
          </div>
        );
      case "manage":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onBackFromAccountManage}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <span className="text-gray-800 text-sm">돌아가기</span>
            </button>
            <div className="h-10 w-full" />
          </div>
        );
      case "edit":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCancelEdit}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <span className="text-gray-800 text-sm">취소</span>
            </button>
            <button
              onClick={onSaveEdit}
              className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600"
            >
              <span className="text-white text-sm">저장</span>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // --- 로딩/에러 처리 ---
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

  // --- 최종 렌더링 ---
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCloseModal}
      />
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">{modalTitle()}</h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 flex flex-col items-center">
            {renderBody()}
            {formError && <div className="w-full mt-2 text-red-500 text-sm">{formError}</div>}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 w-full">{renderFooter()}</div>
      </div>
    </div>
  );
};

export default ProfileCard;
