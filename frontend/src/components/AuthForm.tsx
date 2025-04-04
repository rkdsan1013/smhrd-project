// /frontend/src/components/AuthForm.tsx
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  FormEvent,
} from "react";
import { validateEmail, validatePassword, validateFullProfile } from "../utils/validators";
import { formatYear, formatTwoDigits, getMaxDay } from "../utils/dateUtils";
import { checkEmailExists, signIn, signUp } from "../services/authService";
import Icons from "./Icons";

// 폼 상태 및 오류 필드 타입 정의
type FormState = "start" | "signin" | "signup" | "profile";
type ErrorField = "email" | "password" | "confirmPassword" | "name" | null;

const formConfig: Record<FormState, { title: string; buttonLabel: string }> = {
  start: { title: "시작하기", buttonLabel: "시작하기" },
  signin: { title: "로그인", buttonLabel: "로그인" },
  signup: { title: "회원가입", buttonLabel: "다음" },
  profile: { title: "정보입력", buttonLabel: "가입하기" },
};

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

const AuthForm: React.FC = () => {
  // 상태 변수들
  const [formState, setFormState] = useState<FormState>("start");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [paradoxFlag, setParadoxFlag] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // 오류가 발생한 필드를 저장하는 상태
  const [errorField, setErrorField] = useState<ErrorField>(null);

  // ref 그룹
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthYearRef = useRef<HTMLInputElement>(null);
  const birthMonthRef = useRef<HTMLInputElement>(null);
  const birthDayRef = useRef<HTMLInputElement>(null);
  const cardOuterRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 최초 마운트 확인
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 폼 상태 전환 시, 해당 입력란으로 포커스 부여
  useLayoutEffect(() => {
    if (formState === "start") {
      emailRef.current?.focus();
    } else if (formState === "signin" || formState === "signup") {
      passwordRef.current?.focus();
    }
  }, [formState]);

  // 회원가입폼에서 정보입력폼("profile") 전환 시, 약간의 딜레이 후 이름 입력란에 포커스 부여
  useEffect(() => {
    if (formState === "profile") {
      setTimeout(() => {
        nameRef.current?.focus();
      }, 50);
    }
  }, [formState]);

  // 로딩 완료 후, errorMsg와 errorField가 있으면 해당 필드로 포커스 전환
  useEffect(() => {
    if (!isLoading && errorMsg && errorField) {
      switch (errorField) {
        case "email":
          emailRef.current?.focus();
          break;
        case "password":
          passwordRef.current?.focus();
          break;
        case "confirmPassword":
          confirmPasswordRef.current?.focus();
          break;
        case "name":
          nameRef.current?.focus();
          break;
      }
      setErrorField(null);
    }
  }, [errorMsg, isLoading, errorField]);

  // 카드 높이 애니메이션 (폼 크기 변경 효과)
  useLayoutEffect(() => {
    const outer = cardOuterRef.current;
    const inner = cardInnerRef.current;
    if (!outer || !inner) return;
    const newHeight = inner.offsetHeight;
    if (!hasMounted) {
      outer.style.transition = "none";
      outer.style.height = `${newHeight}px`;
      return;
    }
    const currentHeight = parseFloat(window.getComputedStyle(outer).height || "0");
    if (Math.round(currentHeight) === Math.round(newHeight)) return;
    outer.style.transition = "none";
    outer.style.height = `${currentHeight}px`;
    // 강제 리플로우
    outer.getBoundingClientRect();
    outer.style.transition = "height 0.3s ease-in-out";
    outer.style.height = `${newHeight}px`;
  }, [hasMounted, formState, errorMsg, showOverride]);

  // 생일 입력 값 보정
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

  // 공통 헬퍼 함수
  const formatError = (error: unknown): string =>
    error instanceof Error ? error.message.replace(/^Error:\s*/, "") : String(error);

  // 입력값 변경 핸들러 (중복 제거)
  const handleChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setter(e.target.value);
        setErrorMsg("");
        if (["birthYear", "birthMonth", "birthDay"].includes(e.target.id)) {
          setShowOverride(false);
        }
      },
    [],
  );

  // 키보드 이벤트 핸들러 (Escape 누르면 뒤로가기)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (formState !== "start" && e.key === "Escape") {
      handleBack();
    }
  };

  // 뒤로가기 처리 (폼 상태별 초기화)
  const handleBack = useCallback(() => {
    setErrorMsg("");
    if (formState === "profile") {
      setFormState("signup");
      setName("");
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
      setGender("");
      setProfilePicture(null);
      setProfilePreview(null);
      setParadoxFlag(false);
      setShowOverride(false);
    } else {
      setFormState("start");
      setPassword("");
      setConfirmPassword("");
    }
  }, [formState]);

  // 파일 선택 및 미리보기 처리
  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 생일 입력 관련 핸들러
  const handleBirthYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParadoxFlag(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setBirthYear(val);
    setErrorMsg("");
    if (val.length === 4) birthMonthRef.current?.focus();
  };

  const handleBirthYearBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value.length < 4) {
      setBirthYear(formatYear(e.target.value));
    }
  };

  const handleBirthMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParadoxFlag(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setBirthMonth(val);
    setErrorMsg("");
    if (val.length === 2) birthDayRef.current?.focus();
  };

  const handleBirthMonthBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setBirthMonth(formatTwoDigits(e.target.value, 12));
    }
  };

  const handleBirthDayChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParadoxFlag(false);
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setBirthDay(val);
    setErrorMsg("");
  };

  const handleBirthDayBlur = (e: FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (!current) {
      setBirthDay("");
    } else {
      let maxDay = 31;
      if (birthYear && birthMonth) maxDay = getMaxDay(birthYear, birthMonth);
      setBirthDay(formatTwoDigits(current, maxDay));
    }
  };

  // 제출 함수: 시작(이메일 입력)
  const handleStartSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || "유효한 이메일 주소를 입력해 주세요.");
      setErrorField("email");
      return;
    }
    try {
      const exists = await checkEmailExists(email);
      setFormState(exists ? "signin" : "signup");
    } catch (error) {
      setErrorMsg(formatError(error));
      setErrorField("email");
    }
  };

  // 제출 함수: 로그인
  const handleSignInSubmit = async () => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || "비밀번호가 유효하지 않습니다.");
      setErrorField("password");
      return;
    }
    try {
      const resp = await signIn(email, password);
      if (resp.success) {
        handleAuthSuccess(resp, "로그인 성공:");
      } else {
        setErrorMsg("로그인에 실패하였습니다.");
        setErrorField("password");
      }
    } catch (error) {
      setErrorMsg(formatError(error));
      setErrorField("password");
    }
  };

  // 제출 함수: 회원가입 (검증 후 정보입력 폼으로 전환)
  const handleSignUpSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || "유효한 이메일 주소를 입력해 주세요.");
      setErrorField("email");
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || "비밀번호가 유효하지 않습니다.");
      setErrorField("password");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      setErrorField("confirmPassword");
      return;
    }
    // 검증 통과 후 정보입력폼("profile")으로 전환
    setFormState("profile");
  };

  // 제출 함수: 프로필 입력(최종 회원가입)
  const handleProfileSubmit = async () => {
    const profileValidation = validateFullProfile(
      name,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      paradoxFlag,
    );
    if (!profileValidation.valid) {
      if (profileValidation.requiresOverride) setShowOverride(true);
      setErrorMsg(profileValidation.message || "프로필 정보를 확인해 주세요.");
      setErrorField("name");
      return;
    }
    const formattedBirthdate = `${birthYear.padStart(4, "0")}-${birthMonth.padStart(
      2,
      "0",
    )}-${birthDay.padStart(2, "0")}`;
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("gender", gender);
      formData.append("birthdate", formattedBirthdate);
      formData.append("paradoxFlag", paradoxFlag ? "1" : "0");
      if (profilePicture) formData.append("profilePicture", profilePicture);
      const resp = await signUp(formData);
      if (resp.success) {
        handleAuthSuccess(resp, "회원가입 성공:");
      } else {
        setErrorMsg("회원가입에 실패하였습니다.");
        setErrorField("name");
      }
    } catch (error) {
      setErrorMsg(formatError(error));
      setErrorField("name");
    }
  };

  // 인증 성공 후 처리
  const handleAuthSuccess = (resp: { user?: { uuid: string; email: string } }, msg: string) => {
    console.log(msg, resp);
    window.dispatchEvent(new CustomEvent("userSignedIn", { detail: { user: resp.user } }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        ref={cardOuterRef}
        className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden"
      >
        <div ref={cardInnerRef} className="p-8">
          <h2 className="text-3xl font-bold text-gray-800">{formConfig[formState].title}</h2>
          <form onSubmit={handleSubmit} noValidate onKeyDown={handleKeyDown}>
            {/* 폼 내부 요소들을 하나의 flex-col 컨테이너로 묶어 일관된 gap 유지 */}
            <div className="flex flex-col space-y-6 mt-6">
              {formState !== "profile" && (
                <div className="relative z-0 w-full">
                  <input
                    type="email"
                    id="email"
                    ref={emailRef}
                    value={email}
                    onChange={handleChange(setEmail)}
                    disabled={isLoading || formState !== "start"}
                    className={`${baseInputClass} ${
                      isLoading || formState !== "start"
                        ? "opacity-50 text-gray-500"
                        : "text-gray-900"
                    }`}
                    placeholder=" "
                  />
                  <label htmlFor="email" className={labelClass}>
                    이메일
                  </label>
                </div>
              )}
              {formState === "signin" && (
                <div className="relative z-0 w-full">
                  <input
                    type="password"
                    id="password"
                    ref={passwordRef}
                    value={password}
                    onChange={handleChange(setPassword)}
                    disabled={isLoading}
                    className={`${baseInputClass} ${
                      isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                    }`}
                    placeholder=" "
                  />
                  <label htmlFor="password" className={labelClass}>
                    비밀번호
                  </label>
                </div>
              )}
              {formState === "signup" && (
                <>
                  <div className="relative z-0 w-full">
                    <input
                      type="password"
                      id="password"
                      ref={passwordRef}
                      value={password}
                      onChange={handleChange(setPassword)}
                      disabled={isLoading}
                      className={`${baseInputClass} ${
                        isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                      }`}
                      placeholder=" "
                    />
                    <label htmlFor="password" className={labelClass}>
                      비밀번호
                    </label>
                  </div>
                  <div className="relative z-0 w-full">
                    <input
                      type="password"
                      id="confirmPassword"
                      ref={confirmPasswordRef}
                      value={confirmPassword}
                      onChange={handleChange(setConfirmPassword)}
                      disabled={isLoading}
                      className={`${baseInputClass} ${
                        isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                      }`}
                      placeholder=" "
                    />
                    <label htmlFor="confirmPassword" className={labelClass}>
                      비밀번호 확인
                    </label>
                  </div>
                </>
              )}
              {formState === "profile" && (
                <>
                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="profilePicture"
                      className="relative group w-32 h-32 rounded-full overflow-hidden"
                    >
                      <div className="w-full h-full">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="프로필 미리보기"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                            이미지 선택
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </label>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                  </div>
                  <div className="relative z-0 w-full">
                    <input
                      type="text"
                      id="name"
                      ref={nameRef}
                      value={name}
                      onChange={handleChange(setName)}
                      disabled={isLoading}
                      className={`${baseInputClass} ${
                        isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                      }`}
                      placeholder=" "
                    />
                    <label htmlFor="name" className={labelClass}>
                      이름
                    </label>
                  </div>
                  <div className="relative z-0 w-full">
                    <label className="block text-sm text-gray-500">생일</label>
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
                        disabled={isLoading}
                        className={`block w-1/3 border-b-2 pb-2 pt-2 text-base text-center ${
                          isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                        } bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out`}
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
                        disabled={isLoading}
                        className={`block w-1/3 border-b-2 pb-2 pt-2 text-base text-center ${
                          isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                        } bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out`}
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
                        disabled={isLoading}
                        className={`block w-1/3 border-b-2 pb-2 pt-2 text-base text-center ${
                          isLoading ? "opacity-50 text-gray-500" : "text-gray-900"
                        } bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out`}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block mb-2 text-sm font-medium text-gray-600">성별</span>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <label
                          className={`flex items-center justify-center w-24 py-2 border rounded-lg transition-colors duration-300 ease-in-out focus-within:ring-2 focus-within:ring-blue-300 ${
                            isLoading ? "opacity-50" : ""
                          } ${
                            gender === "male"
                              ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                              : "bg-white text-blue-500 border-blue-500 hover:bg-blue-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={gender === "male"}
                            onChange={handleChange(setGender)}
                            disabled={isLoading}
                            className="sr-only"
                          />
                          <span>남성</span>
                        </label>
                        <label
                          className={`flex items-center justify-center w-24 py-2 border rounded-lg transition-colors duration-300 ease-in-out focus-within:ring-2 focus-within:ring-blue-300 ${
                            isLoading ? "opacity-50" : ""
                          } ${
                            gender === "female"
                              ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                              : "bg-white text-blue-500 border-blue-500 hover:bg-blue-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={gender === "female"}
                            onChange={handleChange(setGender)}
                            disabled={isLoading}
                            className="sr-only"
                          />
                          <span>여성</span>
                        </label>
                      </div>
                      {showOverride && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setParadoxFlag((prev) => !prev)}
                            disabled={isLoading}
                            className={`flex items-center justify-center w-32 py-2 border rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                              isLoading ? "opacity-50" : ""
                            } ${
                              paradoxFlag
                                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                                : "bg-white text-blue-500 border-blue-500 hover:bg-blue-100"
                            }`}
                          >
                            시간 여행자
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
            </div>
            {/* 버튼 영역 */}
            <div className="flex flex-col space-y-4 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 text-white bg-blue-500 rounded-lg transition-colors duration-300 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              >
                <div className="flex items-center justify-center">
                  {isLoading ? (
                    <Icons
                      name="spinner"
                      className="animate-spin h-5 w-5 text-white/50 fill-white"
                    />
                  ) : (
                    <span>{formConfig[formState].buttonLabel}</span>
                  )}
                </div>
              </button>
              {formState !== "start" && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="w-full h-10 py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-300 ease-in-out"
                >
                  뒤로가기
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
