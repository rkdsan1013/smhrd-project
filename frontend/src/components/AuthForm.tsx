// /frontend/src/AuthForm.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  validateEmail,
  validatePassword,
  validateFullProfile,
} from "../utils/validators";
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
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600";

const AuthForm: React.FC = () => {
  // 폼 상태
  const [formState, setFormState] = useState<FormState>("start");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  // gender 값은 "male", "female", "timeTraveler" 중 하나
  const [gender, setGender] = useState("");
  // override 옵션 버튼 표시 여부 (가입하기 클릭 후 날짜 오류가 있을 때만 활성화)
  const [showOverride, setShowOverride] = useState(false);

  // ref 설정
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthYearRef = useRef<HTMLInputElement>(null);
  const birthMonthRef = useRef<HTMLInputElement>(null);
  const birthDayRef = useRef<HTMLInputElement>(null);

  // 트랜지션을 적용할 컨테이너 & 내부 컨텐츠 ref
  const cardOuterRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  // "이전 렌더링의 최종 높이"를 보관할 ref
  const prevHeightRef = useRef(0);

  // 에러 메시지 포매팅 함수
  const formatError = (error: unknown): string =>
    error instanceof Error
      ? error.message.replace(/^Error:\s*/, "")
      : String(error);

  // formState에 따른 입력 포커스 설정
  useEffect(() => {
    if (formState === "start") {
      emailRef.current?.focus();
    } else if (formState === "signin" || formState === "signup") {
      passwordRef.current?.focus();
    } else if (formState === "profile") {
      nameRef.current?.focus();
    }
  }, [formState]);

  // 생년월일 자동 보정 (월에 따른 최대 일 수)
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

  // 공통 change 핸들러 (에러 초기화 포함)
  const handleChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setter(e.target.value);
        setErrorMsg("");
      },
    []
  );

  // 생년월일 입력 핸들러들
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
    const current = e.target.value;
    if (current && current.length < 4) {
      setBirthYear(formatYear(current));
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
    setBirthMonth(current === "" ? "" : formatTwoDigits(current, 12));
  };
  const handleBirthDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverride(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setBirthDay(val);
    setErrorMsg("");
  };
  const handleBirthDayBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (current === "") {
      setBirthDay("");
    } else {
      let maxDay = 31;
      if (birthYear && birthMonth) {
        maxDay = getMaxDay(birthYear, birthMonth);
      }
      setBirthDay(formatTwoDigits(current, maxDay));
    }
  };

  // 프로필 사진 핸들러
  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    if (formState === "profile") {
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
      setFormState("start");
      setPassword("");
      setConfirmPassword("");
    }
    setErrorMsg("");
  }, [formState]);

  // 키보드 이벤트 핸들러 (Escape 시 뒤로가기)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (formState !== "start" && e.key === "Escape") {
      handleBack();
    }
  };

  // 인증 성공 후 처리
  const handleAuthSuccess = (
    resp: { user?: { uuid: string; email: string } },
    msg: string
  ) => {
    console.log(msg, resp);
    window.dispatchEvent(
      new CustomEvent("userSignedIn", { detail: { user: resp.user } })
    );
  };

  // 각 단계별 제출 핸들러
  const handleStartSubmit = async () => {
    const { valid, message } = validateEmail(email);
    if (!valid) {
      setErrorMsg(message || "유효한 이메일을 입력해주세요.");
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
    const { valid, message } = validatePassword(password);
    if (!valid) {
      setErrorMsg(message || "비밀번호가 유효하지 않습니다.");
      return;
    }
    try {
      const resp = await signInService(email, password);
      resp.success
        ? handleAuthSuccess(resp, "로그인 성공:")
        : setErrorMsg("로그인에 실패했습니다.");
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSignUpSubmit = async () => {
    if (!validateEmail(email).valid) {
      setErrorMsg("유효한 이메일을 입력해주세요.");
      return;
    }
    if (!validatePassword(password).valid) {
      setErrorMsg("비밀번호가 유효하지 않습니다.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }
    setFormState("profile");
  };

  const handleProfileSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg("이름을 입력해주세요.");
      return;
    }
    if (!birthYear.trim() || !birthMonth.trim() || !birthDay.trim()) {
      setErrorMsg("생년월일을 모두 입력해주세요.");
      return;
    }
    if (!gender.trim()) {
      setErrorMsg("성별을 선택해주세요.");
      return;
    }
    const profileValidation = validateFullProfile(
      name,
      birthYear,
      birthMonth,
      birthDay,
      gender
    );
    if (!profileValidation.valid) {
      if (profileValidation.requiresOverride) {
        setShowOverride(true);
      }
      setErrorMsg(profileValidation.message || "");
      return;
    }
    setShowOverride(false);
    // 생년월일 포매팅: YYYY-MM-DD
    const formattedBirthdate = `${birthYear.padStart(4, "0")}-${birthMonth.padStart(
      2,
      "0"
    )}-${birthDay.padStart(2, "0")}`;

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
      resp.success
        ? handleAuthSuccess(resp, "회원가입 성공:")
        : setErrorMsg("회원가입에 실패했습니다.");
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  // 폼을 제출
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
   * 1) 이전(직전) 높이를 우선 적용해 두고,
   * 2) 강제 reflow 후,
   * 3) 새 offsetHeight로 변경 → 트랜지션 발생
   */
  useLayoutEffect(() => {
    const outer = cardOuterRef.current;
    const inner = cardInnerRef.current;
    if (!outer || !inner) return;

    // 새 컨텐츠 실제 높이를 미리 측정
    const newHeight = inner.offsetHeight;

    // 트랜지션 비활성화한 상태에서 "이전 높이" 세팅
    outer.style.transition = "none";

    // 이전 렌더링 때 저장해둔 높이를 px로 세팅 (초기엔 0이므로, 첫 렌더 시 사실상 0px에서 시작)
    outer.style.height = prevHeightRef.current + "px";

    // 레이아웃 강제 계산 (reflow)
    outer.getBoundingClientRect();

    // 이제 트랜지션 활성화
    outer.style.transition = "height 0.3s ease-in-out";

    // 새로운 높이로 변경 (애니메이션 발생)
    outer.style.height = newHeight + "px";

    // "이번 렌더의 실제 높이"를 다음 렌더를 위해 저장
    prevHeightRef.current = newHeight;
  }, [
    formState,
    errorMsg,
    showOverride,
    profilePreview,
    name,
    birthYear,
    birthMonth,
    birthDay,
    gender,
    password,
    confirmPassword,
  ]);

  // 트랜지션 완료 후 height="auto" 복귀
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    const outer = cardOuterRef.current;
    const inner = cardInnerRef.current;
    if (!outer || !inner) return;
    if (e.target === outer && e.propertyName === "height") {
      // 트랜지션 종료 시점, 실제 컨텐츠 높이와 같으면 auto 처리
      const currentHeight = inner.offsetHeight;
      // 만약 컨테이너가 실제 높이를 정확히 보여주고 있다면 auto로 전환
      if (Math.round(currentHeight) === Math.round(prevHeightRef.current)) {
        outer.style.transition = "none"; // auto로 바꾸기 직전에 transition 끄기
        outer.style.height = "auto";
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
      {/* 애니메이션 컨테이너 */}
      <div
        ref={cardOuterRef}
        onTransitionEnd={handleTransitionEnd}
        className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden"
      // height는 자바스크립트로 제어하므로 CSS로는 명시X
      // Tailwind 클래스 대신 style.height / style.transition 등을 JS에서 제어
      >
        <div ref={cardInnerRef} className="p-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-800">
            {formConfig[formState].title}
          </h2>
          <form onSubmit={handleSubmit} noValidate onKeyDown={handleKeyDown}>
            {formState !== "profile" && (
              <div className="relative z-0 w-full mb-6">
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  value={email}
                  onChange={handleChange(setEmail)}
                  disabled={formState !== "start"}
                  className={`${baseInputClass} ${formState !== "start"
                      ? "cursor-not-allowed opacity-50 text-gray-500"
                      : "text-gray-900"
                    }`}
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform 
                             -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
                             peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                >
                  이메일
                </label>
              </div>
            )}
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
                  className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform 
                             -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
                             peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                >
                  비밀번호
                </label>
              </div>
            )}
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
                    className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform 
                               -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
                               peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
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
                    className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform 
                               -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
                               peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    비밀번호 확인
                  </label>
                </div>
              </>
            )}
            {formState === "profile" && (
              <>
                <div className="mb-6 flex flex-col items-center">
                  <label htmlFor="profilePicture" className="cursor-pointer">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="프로필 미리보기"
                        className="w-32 h-32 rounded-full object-cover mb-2"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                        <span className="text-gray-500">미리보기</span>
                      </div>
                    )}
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
                    className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform 
                               -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
                               peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
                  >
                    이름
                  </label>
                </div>
                <div className="relative z-0 w-full mb-6">
                  <label className="block text-sm text-gray-500 mb-1">
                    생일
                  </label>
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
                      className="block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                                 bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600"
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
                      className="block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                                 bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600"
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
                      className="block w-1/3 border-b-2 pb-2 pt-2 text-base text-center text-gray-900 
                                 bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <span className="block mb-2 text-sm font-medium text-gray-600">
                    성별
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <label
                        className={`flex items-center justify-center w-24 py-2 border rounded-md cursor-pointer transition-colors duration-200 ${gender === "male"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300"
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
                        className={`flex items-center justify-center w-24 py-2 border rounded-md cursor-pointer transition-colors duration-200 ${gender === "female"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300"
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
                          className={`flex items-center justify-center w-24 py-2 border rounded-md cursor-pointer transition-colors duration-200 ${gender === "timeTraveler"
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-700 border-gray-300"
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
            {errorMsg && (
              <p className="mt-2 mb-4 text-sm text-red-500">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-75"
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
            {formState !== "start" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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