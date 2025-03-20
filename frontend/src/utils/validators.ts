// /frontend/src/utils/validators.ts
import validator from "validator";

export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 60;

export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  if (!email.trim()) {
    return { valid: false, message: "이메일을 입력해주세요." };
  }
  if (
    !validator.isEmail(email) ||
    email.length < MIN_EMAIL_LENGTH ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    return { valid: false, message: "유효한 이메일 주소를 입력해주세요." };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password.trim()) {
    return { valid: false, message: "비밀번호를 입력해주세요." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, message: `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.` };
  }
  if (!validator.isAscii(password)) {
    return { valid: false, message: "비밀번호는 ASCII 문자만 사용 가능합니다." };
  }
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; message?: string } => {
  if (!name.trim()) return { valid: false, message: "이름을 입력해주세요." };
  return { valid: true };
};

export const validateBirthDate = (
  year: string,
  month: string,
  day: string
): { valid: boolean; message?: string } => {
  if (!year.trim() || !month.trim() || !day.trim()) {
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

export const validateGender = (gender: string): { valid: boolean; message?: string } => {
  if (!["male", "female", "timeTraveler"].includes(gender)) {
    return { valid: false, message: "성별을 올바르게 선택해주세요." };
  }
  return { valid: true };
};

export const validateFullProfile = (
  name: string,
  year: string,
  month: string,
  day: string,
  gender: string
): { valid: boolean; message?: string; requiresOverride?: boolean } => {
  const nameValidation = validateName(name);
  if (!nameValidation.valid) return nameValidation;

  const birthValidation = validateBirthDate(year, month, day);
  if (!birthValidation.valid) return birthValidation;

  const genderValidation = validateGender(gender);
  if (!genderValidation.valid) return genderValidation;

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { valid: false, message: "생년월일이 올바르지 않습니다." };
  }
  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) {
    age--;
  }

  if (birthDate.getTime() > today.getTime()) {
    if (gender !== "timeTraveler") {
      return {
        valid: false,
        message: "미래에서 온 당신, 타임머신은 아직 불법입니다!",
        requiresOverride: true,
      };
    }
  } else if (age > 130) {
    if (gender !== "timeTraveler") {
      return {
        valid: false,
        message: "너무 오래 살 수는 없습니다. 당신은 영원히 젊어야 해요!",
        requiresOverride: true,
      };
    }
  }

  return { valid: true };
};