// /frontend/src/AuthForm.tsx
import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { validateEmail, validatePassword, validateFullProfile } from "../utils/validators";
import { formatYear, formatTwoDigits, getMaxDay } from "../utils/dateUtils";
import {
  checkEmailExists,
  signIn as signInService,
  signUp as signUpService,
} from "../services/authService";

type FormState = "start" | "signin" | "signup" | "profile";

const formConfig: Record<FormState, { title: string; buttonLabel: string }> = {
  start: { title: "시작하기", buttonLabel: "시작하기" },
  signin: { title: "로그인", buttonLabel: "로그인" },
  signup: { title: "회원가입", buttonLabel: "다음" },
  profile: { title: "정보입력", buttonLabel: "가입하기" },
};

// 공통 입력 기본 클래스 (디자인 유지)
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent " +
  "focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 " +
  "transition-all duration-300 ease-in-out";

const AuthForm: React.FC = () => {
  // 폼 상태
  const [formState, setFormState] = useState<FormState>("start");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 회원가입/프로필 관련 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [gender, setGender] = useState("");
  const [showOverride, setShowOverride] = useState(false);

  // ref (단계별 포커스)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthYearRef = useRef<HTMLInputElement>(null);
  const birthMonthRef = useRef<HTMLInputElement>(null);
  const birthDayRef = useRef<HTMLInputElement>(null);

  // 애니메이션 대상
  const cardOuterRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  // "처음 렌더 이후인지" 여부
  const [hasMounted, setHasMounted] = useState(false);

  /** ------------------------------
   *  UI 로직
   * ------------------------------ */
  // 첫 렌더 뒤에는 hasMounted를 true로 (초기 애니메이션 방지 등)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 단계 전환 시 자동 포커스
  useEffect(() => {
    if (formState === "start") {
      emailRef.current?.focus();
    } else if (formState === "signin" || formState === "signup") {
      passwordRef.current?.focus();
    } else if (formState === "profile") {
      nameRef.current?.focus();
    }
  }, [formState]);

  // ESC 키 → 뒤로가기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (formState !== "start" && e.key === "Escape") {
      handleBack();
    }
  };

  // 에러메시지 포매팅
  const formatError = (error: unknown): string =>
    error instanceof Error ? error.message.replace(/^Error:\s*/, "") : String(error);

  // 공통 change 핸들러: 에러메시지 초기화
  const handleChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setter(e.target.value);
        setErrorMsg("");
      },
    []
  );

  // 뒤로가기
  const handleBack = useCallback(() => {
    if (formState === "profile") {
      // 프로필 입력 단계면 "signup"단계로 돌아감
      setFormState("signup");
      setName("");
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
      setGender("");
      setProfilePicture(null);
      setProfilePreview(null);
      setShowOverride(false);
    } else {
      // 그 외면 "start" 단계로
      setFormState("start");
      setPassword("");
      setConfirmPassword("");
    }
    setErrorMsg("");
  }, [formState]);

  // 프로필 사진
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 생년월일 관련 (자동 보정)
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      const y = parseInt(birthYear, 10);
      const m = parseInt(birthMonth, 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        const maxDay = getMaxDay(birthYear, birthMonth);
        if (parseInt(birthDay, 10) > maxDay) {
          setBirthDay(String(maxDay).padStart(2, "0"));
        }
      }
    }
  }, [birthYear, birthMonth, birthDay]);

  const handleBirthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverride(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setBirthYear(val);
    setErrorMsg("");
    if (val.length === 4) {
      birthMonthRef.current?.focus();
    }
  };
  const handleBirthYearBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value.length < 4) {
      setBirthYear(formatYear(e.target.value));
    }
  };
  const handleBirthMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverride(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setBirthMonth(val);
    setErrorMsg("");
    if (val.length === 2) {
      birthDayRef.current?.focus();
    }
  };
  const handleBirthMonthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (current) {
      setBirthMonth(formatTwoDigits(current, 12));
    }
  };
  const handleBirthDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverride(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setBirthDay(val);
    setErrorMsg("");
  };
  const handleBirthDayBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (!current) {
      setBirthDay("");
    } else {
      let maxDay = 31;
      if (birthYear && birthMonth) {
        maxDay = getMaxDay(birthYear, birthMonth);
      }
      setBirthDay(formatTwoDigits(current, maxDay));
    }
  };

  /** ------------------------------
   *  폼 제출 로직 (단계별)
   * ------------------------------ */
  const handleStartSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || "유효한 이메일 주소를 입력해주세요.");
      return;
    }
    try {
      const exists = await checkEmailExists(email);
      setFormState(exists ? "signin" : "signup");
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSignInSubmit = async () => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || "비밀번호가 유효하지 않습니다.");
      return;
    }
    try {
      const resp = await signInService(email, password);
      if (resp.success) {
        handleAuthSuccess(resp, "로그인 성공:");
      } else {
        setErrorMsg("로그인에 실패했습니다.");
      }
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSignUpSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || "유효한 이메일 주소를 입력해주세요.");
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || "비밀번호가 유효하지 않습니다.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }
    setFormState("profile");
  };

  const handleProfileSubmit = async () => {
    const profileValidation = validateFullProfile(name, birthYear, birthMonth, birthDay, gender);
    if (!profileValidation.valid) {
      if (profileValidation.requiresOverride) {
        setShowOverride(true);
      }
      setErrorMsg(profileValidation.message || "프로필 정보를 확인해주세요.");
      return;
    }
    setShowOverride(false);

    const formattedBirthdate = `${birthYear.padStart(4, "0")}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("birthdate", formattedBirthdate);
      formData.append("gender", gender);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      const resp = await signUpService(formData);
      if (resp.success) {
        handleAuthSuccess(resp, "회원가입 성공:");
      } else {
        setErrorMsg("회원가입에 실패했습니다.");
      }
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  // 인증 성공 시
  const handleAuthSuccess = (resp: { user?: { uuid: string; email: string } }, msg: string) => {
    console.log(msg, resp);
    window.dispatchEvent(new CustomEvent("userSignedIn", { detail: { user: resp.user } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      if (formState === "start") await handleStartSubmit();
      else if (formState === "signin") await handleSignInSubmit();
      else if (formState === "signup") await handleSignUpSubmit();
      else if (formState === "profile") await handleProfileSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * (중요) 실제 폼 높이를 애니메이션하는 로직
   *
   * 의존성 배열에 "실제로 폼 크기에 큰 영향을 주는 상태"만 포함!
   * (formState, errorMsg, showOverride 등)
   */
  useLayoutEffect(() => {
    const outer = cardOuterRef.current;
    const inner = cardInnerRef.current;
    if (!outer || !inner) return;

    // 새 높이
    const newHeight = inner.offsetHeight;

    // 첫 렌더 전이면(즉, 아직 hasMounted가 false) → 애니메이션 없이 즉시 설정
    if (!hasMounted) {
      outer.style.transition = "none";
      outer.style.height = newHeight + "px";
      return;
    }

    // 첫 렌더 이후
    const currentHeight = parseFloat(window.getComputedStyle(outer).height || "0");
    if (Math.round(currentHeight) === Math.round(newHeight)) {
      // 이미 같은 높이면 트랜지션 필요 없음
      return;
    }

    // 1) 트랜지션 끄고, 현재 높이로 설정
    outer.style.transition = "none";
    outer.style.height = currentHeight + "px";

    // 2) reflow
    outer.getBoundingClientRect();

    // 3) 트랜지션 켜고, 새 높이로
    outer.style.transition = "height 0.3s ease-in-out";
    outer.style.height = newHeight + "px";
  }, [hasMounted, formState, errorMsg, showOverride]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
      <div
        ref={cardOuterRef}
        className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden"
      >
        <div ref={cardInnerRef} className="p-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-800">{formConfig[formState].title}</h2>
          <form onSubmit={handleSubmit} noValidate onKeyDown={handleKeyDown}>
            {/* 프로필이 아닌 상태(이메일 입력) */}
            {formState !== "profile" && (
              <div className="relative z-0 w-full mb-6">
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  value={email}
                  onChange={handleChange(setEmail)}
                  disabled={formState !== "start"}
                  className={`${baseInputClass} ${
                    formState !== "start" ? "opacity-50 text-gray-500" : "text-gray-900"
                  }`}
                  placeholder=" "
                />
                {/* 라벨: whitespace-nowrap + origin-top-left */}
                <label
                  htmlFor="email"
                  className="
                    absolute left-0 top-4 z-10 
                    text-sm text-gray-500
                    whitespace-nowrap
                    origin-top-left
                    duration-300 transform
                    -translate-y-6 scale-75
                    peer-placeholder-shown:translate-y-0 
                    peer-placeholder-shown:scale-100
                    peer-focus:-translate-y-6 
                    peer-focus:scale-75 
                    peer-focus:text-blue-600
                  "
                >
                  이메일
                </label>
              </div>
            )}

            {/* signin 상태일 때: 비밀번호 */}
            {formState === "signin" && (
              <div className="relative z-0 w-full mb-6">
                <input
                  type="password"
                  id="password"
                  ref={passwordRef}
                  value={password}
                  onChange={handleChange(setPassword)}
                  className={`${baseInputClass} text-gray-900`}
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="
                    absolute left-0 top-4 z-10
                    text-sm text-gray-500
                    whitespace-nowrap
                    origin-top-left
                    duration-300 transform
                    -translate-y-6 scale-75
                    peer-placeholder-shown:translate-y-0 
                    peer-placeholder-shown:scale-100
                    peer-focus:-translate-y-6 
                    peer-focus:scale-75 
                    peer-focus:text-blue-600
                  "
                >
                  비밀번호
                </label>
              </div>
            )}

            {/* signup 상태일 때: 비밀번호 / 비밀번호 확인 */}
            {formState === "signup" && (
              <>
                <div className="relative z-0 w-full mb-6">
                  <input
                    type="password"
                    id="password"
                    ref={passwordRef}
                    value={password}
                    onChange={handleChange(setPassword)}
                    className={`${baseInputClass} text-gray-900`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="password"
                    className="
                      absolute left-0 top-4 z-10
                      text-sm text-gray-500
                      whitespace-nowrap
                      origin-top-left
                      duration-300 transform
                      -translate-y-6 scale-75
                      peer-placeholder-shown:translate-y-0 
                      peer-placeholder-shown:scale-100
                      peer-focus:-translate-y-6 
                      peer-focus:scale-75 
                      peer-focus:text-blue-600
                    "
                  >
                    비밀번호
                  </label>
                </div>
                <div className="relative z-0 w-full mb-6">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange(setConfirmPassword)}
                    className={`${baseInputClass} text-gray-900`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="
                      absolute left-0 top-4 z-10
                      text-sm text-gray-500
                      whitespace-nowrap
                      origin-top-left
                      duration-300 transform
                      -translate-y-6 scale-75
                      peer-placeholder-shown:translate-y-0 
                      peer-placeholder-shown:scale-100
                      peer-focus:-translate-y-6 
                      peer-focus:scale-75 
                      peer-focus:text-blue-600
                    "
                  >
                    비밀번호 확인
                  </label>
                </div>
              </>
            )}

            {/* profile 상태일 때: 프로필 입력 */}
            {formState === "profile" && (
              <>
                <div className="mb-6 flex flex-col items-center">
                  <label
                    htmlFor="profilePicture"
                    className="relative group cursor-pointer w-32 h-32 mb-2 rounded-full overflow-hidden"
                  >
                    {/* 프로필 이미지 또는 기본 박스 */}
                    <div className="w-full h-full">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="프로필 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          프로필
                        </div>
                      )}
                    </div>
                    {/* 반투명 오버레이 (연필 아이콘 포함) */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 112.828 2.828L11.828 14H9v-3z"
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
                </div>
                <div className="relative z-0 w-full mb-6">
                  <input
                    type="text"
                    id="name"
                    ref={nameRef}
                    value={name}
                    onChange={handleChange(setName)}
                    className={`${baseInputClass} text-gray-900`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="name"
                    className="
                      absolute left-0 top-4 z-10
                      text-sm text-gray-500
                      whitespace-nowrap
                      origin-top-left
                      duration-300 transform
                      -translate-y-6 scale-75
                      peer-placeholder-shown:translate-y-0
                      peer-placeholder-shown:scale-100
                      peer-focus:-translate-y-6
                      peer-focus:scale-75
                      peer-focus:text-blue-600
                    "
                  >
                    이름
                  </label>
                </div>

                {/* 생일(여긴 단순 텍스트/인풋 구조이므로 그대로) */}
                <div className="relative z-0 w-full mb-6">
                  <label className="block text-sm text-gray-500 mb-1">생일</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      id="birthYear"
                      ref={birthYearRef}
                      value={birthYear}
                      onChange={handleBirthYearChange}
                      onBlur={handleBirthYearBlur}
                      onFocus={(e) => e.target.select()}
                      placeholder="YYYY"
                      maxLength={4}
                      inputMode="numeric"
                      className="
                        block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                        bg-transparent focus:outline-none focus:ring-0 
                        border-gray-300 focus:border-blue-600 
                        transition-all duration-300 ease-in-out
                      "
                    />
                    <span className="text-gray-500">|</span>
                    <input
                      type="text"
                      id="birthMonth"
                      ref={birthMonthRef}
                      value={birthMonth}
                      onChange={handleBirthMonthChange}
                      onBlur={handleBirthMonthBlur}
                      onFocus={(e) => e.target.select()}
                      placeholder="MM"
                      maxLength={2}
                      inputMode="numeric"
                      className="
                        block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                        bg-transparent focus:outline-none focus:ring-0 
                        border-gray-300 focus:border-blue-600 
                        transition-all duration-300 ease-in-out
                      "
                    />
                    <span className="text-gray-500">|</span>
                    <input
                      type="text"
                      id="birthDay"
                      ref={birthDayRef}
                      value={birthDay}
                      onChange={handleBirthDayChange}
                      onBlur={handleBirthDayBlur}
                      onFocus={(e) => e.target.select()}
                      placeholder="DD"
                      maxLength={2}
                      inputMode="numeric"
                      className="
                        block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                        bg-transparent focus:outline-none focus:ring-0 
                        border-gray-300 focus:border-blue-600 
                        transition-all duration-300 ease-in-out
                      "
                    />
                  </div>
                </div>

                {/* 성별 (라벨이 absolute가 아니라면 그대로) */}
                <div className="mb-6">
                  <span className="block mb-2 text-sm font-medium text-gray-600">성별</span>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <label
                        className={`flex items-center justify-center w-24 py-2 border rounded-md cursor-pointer transition-all duration-300 ease-in-out ${
                          gender === "male"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === "male"}
                          onChange={handleChange(setGender)}
                          className="hidden"
                        />
                        <span>남성</span>
                      </label>
                      <label
                        className={`flex items-center justify-center w-24 py-2 border rounded-md cursor-pointer transition-all duration-300 ease-in-out ${
                          gender === "female"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={gender === "female"}
                          onChange={handleChange(setGender)}
                          className="hidden"
                        />
                        <span>여성</span>
                      </label>
                    </div>
                    {showOverride && (
                      <div>
                        <label
                          className={`flex items-center justify-center w-34 py-2 border rounded-md cursor-pointer transition-all duration-300 ease-in-out ${
                            gender === "timeTraveler"
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value="timeTraveler"
                            checked={gender === "timeTraveler"}
                            onChange={handleChange(setGender)}
                            className="hidden"
                          />
                          <span>시간 여행자</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 에러 메시지 */}
            {errorMsg && <p className="mt-2 mb-4 text-sm text-red-500">{errorMsg}</p>}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-2 mb-4 text-white bg-blue-500 rounded-lg 
                transition-colors duration-300 ease-in-out
                hover:bg-blue-600 
                focus:outline-none focus:ring-2 
                focus:ring-blue-300
                disabled:opacity-60
              "
            >
              <div className="flex items-center justify-center">
                {isLoading && (
                  <svg
                    className="animate-spin mr-2 h-5 w-5 text-white"
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
                )}
                <span>{formConfig[formState].buttonLabel}</span>
              </div>
            </button>

            {/* 뒤로가기 버튼 */}
            {formState !== "start" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="
                  w-full py-2 text-blue-500 border border-blue-500 rounded-lg 
                  hover:bg-blue-100 
                  focus:outline-none focus:ring-2 
                  focus:ring-blue-300 
                  transition-colors duration-300 ease-in-out
                "
              >
                뒤로가기
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
