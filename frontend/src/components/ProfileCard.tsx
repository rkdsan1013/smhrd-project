import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { logout } from "../services/authService";
import { useUserProfile } from "../hooks/useUserProfile";
import { updateUserProfile } from "../services/userService";
import { validateName, validatePassword } from "../utils/validators";

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
  // 프로필, 로딩, 에러 상태
  const { profile, loading, error } = useUserProfile();

  // 모달, 편집, 비밀번호 변경, 입력값 및 에러 관리
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    profile && profile.profilePicture ? profile.profilePicture : null,
  );
  const [formError, setFormError] = useState<string>("");

  // 높이 애니메이션용 ref들
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 모달 fade-in 효과 (50ms 후 표시)
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

  // 초기 마운트 후 동적 영역 높이 설정
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 내용 변경 시 높이 애니메이션 적용
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
  }, [hasMounted, isEditing, isChangingPassword, formError]);

  // 파일 선택 처리 (프로필 사진 변경)
  const onProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 편집 모드 전환 (현재 높이 저장 후 전환)
  const onEditProfile = () => {
    if (outerRef.current) oldHeightRef.current = outerRef.current.offsetHeight;
    setTimeout(() => {
      setIsEditing(true);
      if (profile) setEditedName(profile.name);
    }, 0);
  };

  // 편집 취소 시 초기화
  const onCancelEdit = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
    setProfilePicture(null);
    setProfilePreview(profile ? profile.profilePicture ?? null : null);
    setFormError("");
  };

  // 저장 전 검증 및 백엔드 요청 (프로필 수정 및 비밀번호 변경 분기 처리)
  const onSaveEdit = async () => {
    if (!isEditing) return;
    if (isChangingPassword) {
      // 비밀번호 변경 검증
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
      // 비밀번호 변경 API 호출 로직 추가 가능 (여기서는 생략)
      alert("비밀번호가 변경되었습니다.");
    } else {
      // 이름 검증
      const nameResult = validateName(editedName);
      if (!nameResult.valid) {
        setFormError(nameResult.message || "유효하지 않은 이름입니다.");
        return;
      }
      // FormData 생성 및 값 추가
      const formData = new FormData();
      formData.append("name", editedName);
      if (profilePicture) formData.append("profilePicture", profilePicture);
      try {
        const resp = await updateUserProfile(formData);
        if (resp.success) {
          alert("프로필이 업데이트되었습니다.");
          setIsEditing(false);
          setProfilePicture(null);
          setProfilePreview(profile ? profile.profilePicture ?? null : null);
          setFormError("");
          // 필요시 업데이트된 프로필 데이터를 다시 반영하는 로직 추가 가능
        } else {
          setFormError("프로필 업데이트에 실패했습니다.");
        }
      } catch (error: any) {
        setFormError(error.message || "업데이트 중 오류가 발생했습니다.");
      }
    }
  };

  // 비밀번호 변경 모드 활성화
  const onChangePassword = () => {
    setIsChangingPassword(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setProfilePicture(null);
    setProfilePreview(profile ? profile.profilePicture ?? null : null);
    setFormError("");
  };

  // 모달 닫기
  const onCloseModal = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // 로그아웃
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
          <h2 className="text-xl font-bold">
            {isEditing ? (isChangingPassword ? "비밀번호 변경" : "프로필 수정") : "프로필 정보"}
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
        {/* 동적 내용 영역 (애니메이션 적용) */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 flex flex-col items-center">
            {/* 프로필 사진 영역 */}
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
            {/* 입력 폼: 이름/이메일 또는 비밀번호 입력 */}
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
              ) : isEditing && isChangingPassword ? (
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
            {/* 편집 모드에서 비밀번호 변경 버튼 */}
            {isEditing && !isChangingPassword && (
              <div className="w-full mt-4">
                <button
                  onClick={onChangePassword}
                  className="w-full px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors duration-300 text-white text-sm"
                >
                  비밀번호 변경
                </button>
              </div>
            )}
            {/* 읽기 모드: 생일, 성별 등 정보 */}
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
            {/* 검증 에러 메시지 */}
            {formError && <div className="w-full mt-2 text-red-500 text-sm">{formError}</div>}
          </div>
        </div>
        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 w-full">
          {isEditing ? (
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
