// /backend/src/utils/validators.js
const validator = require("validator");

const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

// 이메일 유효성 검사 (문자열 여부, 공백 제거, 형식 및 길이 검사)
const validateEmail = (email) => {
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (validator.isEmpty(trimmedEmail, { ignore_whitespace: true })) {
    return { valid: false, message: "이메일을 입력해주세요." };
  }
  if (
    !validator.isEmail(trimmedEmail) ||
    trimmedEmail.length < MIN_EMAIL_LENGTH ||
    trimmedEmail.length > MAX_EMAIL_LENGTH
  ) {
    return { valid: false, message: "유효한 이메일 주소를 입력해주세요." };
  }
  return { valid: true };
};

// 비밀번호 유효성 검사 (문자열 여부, 공백 제거, 길이 및 ASCII 문자 검사)
const validatePassword = (password) => {
  const trimmedPassword = typeof password === "string" ? password.trim() : "";
  if (validator.isEmpty(trimmedPassword, { ignore_whitespace: true })) {
    return { valid: false, message: "비밀번호를 입력해주세요." };
  }
  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` };
  }
  if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.`,
    };
  }
  if (!validator.isAscii(trimmedPassword)) {
    return { valid: false, message: "비밀번호는 ASCII 문자만 사용 가능합니다." };
  }
  return { valid: true };
};

// 이름 유효성 검사 (문자열 여부, 공백 제거, 길이 및 허용 문자 검사)
const validateName = (name) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (validator.isEmpty(trimmedName, { ignore_whitespace: true })) {
    return { valid: false, message: "이름을 입력해주세요." };
  }
  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 짧습니다. 최소 2자 이상 입력해주세요." };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 깁니다. 50자 이하로 입력해주세요." };
  }
  const nameRegex = /^[\p{L}\s.'-]+$/u;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, message: "올바른 형식의 이름을 입력해주세요." };
  }
  return { valid: true };
};

// 생년월일 유효성 검사 (문자열 여부, 형식, 범위 검사)
const validateBirthDate = (year, month, day) => {
  if (typeof year !== "string" || typeof month !== "string" || typeof day !== "string") {
    return { valid: false, message: "생년월일은 문자열로 입력되어야 합니다." };
  }
  if (year.trim() === "" || month.trim() === "" || day.trim() === "") {
    return { valid: false, message: "생년월일을 모두 입력해주세요." };
  }
  if (!/^\d{4}$/.test(year)) {
    return { valid: false, message: "년도를 4자리 숫자로 입력해주세요." };
  }
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12) {
    return { valid: false, message: "월은 1부터 12 사이여야 합니다." };
  }
  const maxDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDay) {
    return { valid: false, message: `해당 달은 최대 ${maxDay}일까지 있습니다.` };
  }
  return { valid: true };
};

// 성별 유효성 검사 (정해진 값인지 확인)
const validateGender = (gender) => {
  const validGenders = ["male", "female", "timeTraveler"];
  if (typeof gender !== "string" || !validGenders.includes(gender)) {
    return { valid: false, message: "성별을 올바르게 선택해주세요." };
  }
  return { valid: true };
};

// 전체 프로필 유효성 검사 (이름, 생년월일, 성별, 나이/미래 날짜 검사)
const validateFullProfile = (name, year, month, day, gender) => {
  const nameResult = validateName(name);
  if (!nameResult.valid) return nameResult;

  const birthResult = validateBirthDate(year, month, day);
  if (!birthResult.valid) return birthResult;

  const genderResult = validateGender(gender);
  if (!genderResult.valid) return genderResult;

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { valid: false, message: "생년월일이 올바르지 않습니다." };
  }
  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  const birthTimestamp = birthDate.getTime();
  const todayTimestamp = today.getTime();

  let age = today.getFullYear() - y;
  if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) {
    age--;
  }
  if (gender !== "timeTraveler" && (age > 130 || birthTimestamp > todayTimestamp)) {
    let easterEgg = "";
    if (birthTimestamp > todayTimestamp) {
      if (birthTimestamp === new Date(2038, 0, 19).getTime()) {
        easterEgg = "2038년 1월 19일, 세계의 시간이 한 바퀴 돌고 있습니다.";
      } else {
        easterEgg = "미래에서 온 당신, 타임머신은 아직 불법입니다!";
      }
    } else if (age > 130) {
      easterEgg = "너무 오래 살 수는 없습니다. 당신은 영원히 젊어야 해요!";
    }
    return { valid: false, message: easterEgg, requiresOverride: true };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateBirthDate,
  validateGender,
  validateFullProfile,
  MIN_EMAIL_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};
