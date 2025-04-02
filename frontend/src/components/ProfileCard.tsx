// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import { logout } from "../services/authService";
import { changePassword } from "../services/authService";
import { updateUserProfile } from "../services/userService";
import { validateName, validatePassword } from "../utils/validators";
import { useUserProfile } from "../contexts/UserProfileContext";

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface ProfileCardProps {
  onClose: () => void;
}

// 성별 변환 유틸 (남성/여성)
const getDisplayGender = (gender?: string) => {
  if (!gender) return "";
  return gender.toLowerCase() === "male"
    ? "남성"
    : gender.toLowerCase() === "female"
    ? "여성"
    : gender;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
  const { profile, loading, error, reloadProfile } = useUserProfile();

  // 주요 상태들
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 프로필 수정 모드 여부
  const [isManagingAccount, setIsManagingAccount] = useState(false); // 편집 모드 내 계정 관리 모드 여부
  const [isChangingPassword, setIsChangingPassword] = useState(false); // 비밀번호 변경 입력폼 노출 여부
  const [isWithdrawing, setIsWithdrawing] = useState(false); // 회원 탈퇴 확인 화면 노출 여부
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

  // 모달 높이 조절 관련 ref
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 모달 페이드인 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 프로필 읽기 값 갱신 (편집 모드가 아닐 때)
  useEffect(() => {
    if (profile && !isEditing) {
      setEditedName(profile.name);
      setProfilePreview(
        profile.profilePicture ? `${profile.profilePicture}?v=${profile.version}` : null,
      );
    }
  }, [profile, isEditing]);

  // 초기 마운트 후 높이 설정
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 내용 변화에 따라 모달 높이 애니메이션 조절
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

  // 프로필 사진 변경 (파일 선택 후 미리보기 업데이트)
  const onProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // "프로필 수정" 버튼 클릭 시 편집 모드 진입
  const onEditProfile = () => {
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

  // 편집 모드 취소 (값 초기화)
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
        setFormError("현재 비밀번호를 입력해주세요.");
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

      // 비밀번호 변경 처리 로직: API 호출
      try {
        const response = await changePassword(currentPassword, newPassword);
        if (response.success) {
          alert("비밀번호가 변경되었습니다.");
          // 비밀번호 변경 성공 시 입력값 초기화 후 비밀번호 변경 폼 종료
          setIsChangingPassword(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setFormError("");
        } else {
          setFormError(response.message || "비밀번호 변경에 실패했습니다.");
        }
      } catch (error: any) {
        setFormError(error.message || "비밀번호 변경 중 오류가 발생했습니다.");
      }
    } else {
      const nameResult = validateName(editedName);
      if (!nameResult.valid) {
        setFormError(nameResult.message || "올바른 이름을 입력해주세요.");
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
          setFormError("프로필 업데이트에 실패했습니다.");
        }
      } catch (error: any) {
        setFormError(error.message || "업데이트 중 오류가 발생했습니다.");
      }
    }
  };

  // 편집 모드 내에서 "계정 관리" 버튼 클릭 시 해당 모드 전환
  const onManageAccount = () => {
    setIsManagingAccount(true);
    setIsChangingPassword(false);
    setIsWithdrawing(false);
  };

  // 계정 관리 모드 내 "비밀번호 변경" 버튼 클릭
  const onChangePasswordFromAccount = () => {
    setIsManagingAccount(false);
    setIsChangingPassword(true);
  };

  // 회원 탈퇴 버튼 클릭 시 탈퇴 확인 화면 노출
  const onWithdraw = () => {
    setIsWithdrawing(true);
  };

  // 탈퇴 확인 화면에서 "취소" 버튼 클릭
  const handleCancelWithdraw = () => {
    setIsWithdrawing(false);
    setWithdrawPassword("");
  };

  // 탈퇴 확인 화면에서 "탈퇴" 버튼 클릭 시 입력값 검증 후 처리 (validator 사용)
  const handleConfirmWithdraw = () => {
    const passResult = validatePassword(withdrawPassword);
    if (!passResult.valid) {
      setFormError(passResult.message || "비밀번호가 유효하지 않습니다.");
      return;
    }
    // 탈퇴 처리 로직 (실제 API 호출 등 추가 가능)
    alert("회원 탈퇴 처리되었습니다.");
    onLogout();
  };

  // 계정 관리 모드에서 "돌아가기" 버튼 클릭
  const onBackFromAccountManage = () => {
    setIsManagingAccount(false);
    setIsWithdrawing(false);
  };

  // 모달 닫기 (모든 수정 모드 초기화)
  const onCloseModal = () => {
    setIsVisible(false);
    setIsManagingAccount(false);
    setTimeout(onClose, 300);
  };

  // 로그아웃 처리
  const onLogout = async () => {
    try {
      await logout();
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  if (loading)
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
  if (error)
    return (
      <div className="fixed inset-0 flex items-center justify-center text-red-500">{error}</div>
    );
  if (!profile) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCloseModal}
      />
      {/* 모달 박스 */}
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
          <h2 className="text-xl font-bold">
            {!isEditing
              ? "프로필 정보"
              : isChangingPassword
              ? "비밀번호 변경"
              : isManagingAccount
              ? "계정 관리"
              : "프로필 수정"}
          </h2>
          <button
            onClick={onCloseModal}
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
        {/* 본문 영역 */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 flex flex-col items-center">
            {!isEditing ? (
              // 읽기 모드: 전체 프로필 정보 표시
              <>
                <div className="mb-6 flex flex-col items-center">
                  <img
                    src={profilePreview || ""}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
                <div className="w-full text-center mb-4">
                  <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.name}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                </div>
                <div className="w-full text-left mt-4">
                  {profile.birthdate && (
                    <p className="text-gray-600 truncate">생일: {profile.birthdate}</p>
                  )}
                  {profile.gender && (
                    <p className="text-gray-600 truncate">
                      성별: {getDisplayGender(profile.gender)}
                    </p>
                  )}
                  {Boolean(profile.paradoxFlag) && (
                    <p className="text-sm text-blue-500 truncate">시간여행은 순조로우신가요?</p>
                  )}
                </div>
              </>
            ) : isEditing && isManagingAccount ? (
              // 계정 관리 모드 내
              isWithdrawing ? (
                // 탈퇴 확인 화면: "정말로 탈퇴하시겠습니까?" + 비밀번호 입력 및 확인/취소 버튼 (버튼은 좌우 배치)
                <div className="w-full flex flex-col items-center text-center mb-4">
                  <p className="text-lg font-semibold mb-4">정말로 탈퇴하시겠습니까?</p>
                  <div className="w-full relative mb-3">
                    <input
                      type="password"
                      value={withdrawPassword}
                      onChange={(e) => setWithdrawPassword(e.target.value)}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label className={labelClass}>비밀번호 입력</label>
                  </div>
                  <div className="flex w-full space-x-2">
                    <button
                      onClick={handleConfirmWithdraw}
                      className="flex-1 h-10 flex items-center justify-center px-4 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white text-sm"
                    >
                      탈퇴
                    </button>
                    <button
                      onClick={handleCancelWithdraw}
                      className="flex-1 h-10 flex items-center justify-center px-4 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors text-gray-800 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 일반 계정 관리 화면: 사진, 이름, 이메일 및 본문에 "비밀번호 변경", "회원 탈퇴" 버튼(세로 배치)
                <div className="w-full flex flex-col items-center text-center mb-4">
                  <div className="mb-6">
                    <img
                      src={profilePreview || ""}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  </div>
                  <div className="text-2xl font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.name}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap overflow-ellipsis overflow-hidden">
                    {profile.email}
                  </div>
                  <div className="mt-4 flex flex-col space-y-2 w-full">
                    <button
                      onClick={onChangePasswordFromAccount}
                      className="w-full h-10 flex items-center justify-center px-4 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors text-white text-sm"
                    >
                      비밀번호 변경
                    </button>
                    <button
                      onClick={onWithdraw}
                      className="w-full h-10 flex items-center justify-center px-4 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white text-sm"
                    >
                      회원 탈퇴
                    </button>
                  </div>
                </div>
              )
            ) : isEditing && isChangingPassword ? (
              // 비밀번호 변경 입력폼
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
                    비밀번호 확인
                  </label>
                </div>
              </div>
            ) : (
              // 기본 프로필 수정 편집폼: 사진 및 이름 수정 (이메일 읽기 전용)
              <>
                <div className="mb-6 flex flex-col items-center">
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
                    onChange={onProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <div className="w-full text-center mb-4">
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
                </div>
                <div className="w-full mt-4">
                  <button
                    onClick={onManageAccount}
                    className="w-full h-10 flex items-center justify-center px-4 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors text-white text-sm"
                  >
                    계정 관리
                  </button>
                </div>
              </>
            )}
            {formError && <div className="w-full mt-2 text-red-500 text-sm">{formError}</div>}
          </div>
        </div>
        {/* 푸터 영역 */}
        {!isEditing ? (
          // 읽기 모드: 로그아웃, 프로필 수정 버튼
          <div className="p-4 border-t border-gray-200 w-full">
            <div className="flex justify-between">
              <button
                onClick={onLogout}
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
                onClick={onEditProfile}
                className="flex items-center justify-center h-10 px-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">프로필 수정</span>
              </button>
            </div>
          </div>
        ) : isEditing && isManagingAccount ? (
          // 계정 관리 모드: 푸터에는 "돌아가기" 버튼을 좌측에 배치 (오른쪽은 빈 공간으로 일관성 유지)
          <div className="p-4 border-t border-gray-200 w-full">
            <div className="flex justify-between">
              <button
                onClick={onBackFromAccountManage}
                className="flex-1 mr-2 h-10 flex items-center justify-center px-4 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm">돌아가기</span>
              </button>
              <div className="flex-1 ml-2 h-10" />
            </div>
          </div>
        ) : (
          // 편집 모드(일반 편집/비밀번호 변경): 취소, 저장 버튼
          <div className="p-4 border-t border-gray-200 w-full">
            <div className="flex justify-between">
              <button
                onClick={onCancelEdit}
                className="flex-1 mr-2 h-10 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm block">취소</span>
              </button>
              <button
                onClick={onSaveEdit}
                className="flex-1 ml-2 h-10 bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm block">
                  {isChangingPassword ? "비밀번호 변경" : "저장"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
