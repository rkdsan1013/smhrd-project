// /backend/src/utils/validators.js
const validator = require("validator");

const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

const validateEmail = (email) => {
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (validator.isEmpty(trimmedEmail, { ignore_whitespace: true })) {
    return { valid: false, message: "이메일을 입력해 주세요." };
  }
  if (
    !validator.isEmail(trimmedEmail) ||
    trimmedEmail.length < MIN_EMAIL_LENGTH ||
    trimmedEmail.length > MAX_EMAIL_LENGTH
  ) {
    return { valid: false, message: "유효한 이메일 주소를 입력해 주세요." };
  }
  return { valid: true };
};

const validatePassword = (password) => {
  const trimmedPassword = typeof password === "string" ? password.trim() : "";
  if (validator.isEmpty(trimmedPassword, { ignore_whitespace: true })) {
    return { valid: false, message: "비밀번호를 입력해 주세요." };
  }
  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` };
  }
  if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해 주세요.`,
    };
  }
  if (!validator.isAscii(trimmedPassword)) {
    return { valid: false, message: "비밀번호는 ASCII 문자만 사용 가능합니다." };
  }
  return { valid: true };
};

const validateName = (name) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (validator.isEmpty(trimmedName, { ignore_whitespace: true })) {
    return { valid: false, message: "이름을 입력해 주세요." };
  }
  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 짧습니다. 최소 2자 이상 입력해 주세요." };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 깁니다. 50자 이하로 입력해 주세요." };
  }
  const nameRegex = /^[\p{L}\s.'-]+$/u;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, message: "올바른 형식의 이름을 입력해 주세요." };
  }
  return { valid: true };
};

const validateGender = (gender) => {
  // "male"과 "female"만 허용
  const validGenders = ["male", "female"];
  if (typeof gender !== "string" || !validGenders.includes(gender)) {
    return { valid: false, message: "성별을 올바르게 선택해 주세요." };
  }
  return { valid: true };
};

const validateBirthDate = (year, month, day) => {
  if (typeof year !== "string" || typeof month !== "string" || typeof day !== "string") {
    return { valid: false, message: "생년월일은 문자열로 입력되어야 합니다." };
  }
  const trimmedYear = year.trim();
  const trimmedMonth = month.trim();
  const trimmedDay = day.trim();
  if (trimmedYear === "" || trimmedMonth === "" || trimmedDay === "") {
    return { valid: false, message: "생년월일을 모두 입력해 주세요." };
  }
  if (!/^\d{4}$/.test(trimmedYear)) {
    return { valid: false, message: "년도를 4자리 숫자로 입력해 주세요." };
  }
  const y = parseInt(trimmedYear, 10);
  const m = parseInt(trimmedMonth, 10);
  const d = parseInt(trimmedDay, 10);
  if (m < 1 || m > 12) {
    return { valid: false, message: "월은 1부터 12 사이여야 합니다." };
  }
  const maxDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDay) {
    return { valid: false, message: `해당 달은 최대 ${maxDay}일까지 있습니다.` };
  }
  return { valid: true };
};

// 인자 순서를 (name, gender, year, month, day, paradoxFlag)로 변경 (DB 순서: 이름, 성별, 생일)
const validateFullProfile = (name, gender, year, month, day, paradoxFlag) => {
  const nameResult = validateName(name);
  if (!nameResult.valid) return nameResult;

  const birthResult = validateBirthDate(year, month, day);
  if (!birthResult.valid) return birthResult;

  const genderResult = validateGender(gender);
  if (!genderResult.valid) return genderResult;

  const y = parseInt(year.trim(), 10);
  const m = parseInt(month.trim(), 10);
  const d = parseInt(day.trim(), 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { valid: false, message: "생년월일이 올바르지 않습니다." };
  }

  // paradoxFlag가 false인 경우에만 나이 및 미래 날짜 검증 수행
  if (!paradoxFlag) {
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    const birthTimestamp = birthDate.getTime();
    const todayTimestamp = today.getTime();

    let age = today.getFullYear() - y;
    if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) {
      age--;
    }
    if (age > 130 || birthTimestamp > todayTimestamp) {
      let message = "";
      if (birthTimestamp > todayTimestamp) {
        message = "미래에서 온 당신, 타임머신은 아직 불법입니다!";
      } else if (age > 130) {
        message = "너무 오래 살 수는 없습니다. 당신은 영원히 젊어야 합니다!";
      }
      return { valid: false, message, requiresOverride: true };
    }
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateGender,
  validateBirthDate,
  validateFullProfile,
  MIN_EMAIL_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};
