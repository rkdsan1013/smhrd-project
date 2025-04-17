// /frontend/src/utils/validators.ts

import validator from "validator";
import { normalizeName } from "./normalize";

// 상수 정의
export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 60;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 1000;

// 이메일 검사: 공백 제거 후 형식 및 길이 체크
export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const trimmedEmail = email.trim();
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

// 비밀번호 검사: 공백 제거, 길이 및 ASCII 문자 검사
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  const trimmedPassword = password.trim();
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

// 이름 검사: 입력값 정규화 후 길이 및 형식 체크
export const validateName = (name: string): { valid: boolean; message?: string } => {
  const normalizedName = normalizeName(name);
  if (validator.isEmpty(normalizedName, { ignore_whitespace: true })) {
    return { valid: false, message: "이름을 입력해 주세요." };
  }
  if (normalizedName.length < MIN_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 짧습니다. 최소 2자 이상 입력해 주세요." };
  }
  if (normalizedName.length > MAX_NAME_LENGTH) {
    return { valid: false, message: "이름이 너무 깁니다. 50자 이하로 입력해 주세요." };
  }
  const nameRegex = /^[\p{L}\s.'-]+$/u;
  if (!nameRegex.test(normalizedName)) {
    return { valid: false, message: "올바른 형식의 이름을 입력해 주세요." };
  }
  return { valid: true };
};

// 성별 검사: "male"과 "female"만 허용
export const validateGender = (gender: string): { valid: boolean; message?: string } => {
  const validGenders = ["male", "female"];
  if (!validGenders.includes(gender)) {
    return { valid: false, message: "성별을 올바르게 선택해 주세요." };
  }
  return { valid: true };
};

// 생년월일 검사: 필수 입력, 형식 및 날짜 유효성 체크
export const validateBirthDate = (
  year: string,
  month: string,
  day: string,
): { valid: boolean; message?: string } => {
  if (!year.trim() || !month.trim() || !day.trim()) {
    return { valid: false, message: "생년월일을 모두 입력해 주세요." };
  }
  if (!/^\d{4}$/.test(year.trim())) {
    return { valid: false, message: "년도를 4자리 숫자로 입력해 주세요." };
  }
  const y = parseInt(year.trim(), 10);
  const m = parseInt(month.trim(), 10);
  const d = parseInt(day.trim(), 10);
  if (m < 1 || m > 12) {
    return { valid: false, message: "월은 1부터 12 사이여야 합니다." };
  }
  const maxDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDay) {
    return { valid: false, message: `해당 달은 최대 ${maxDay}일까지 있습니다.` };
  }
  return { valid: true };
};

// 설명 검사: 빈 문자열 허용, 입력 시 최대 길이 체크
export const validateDescription = (description: string): { valid: boolean; message?: string } => {
  const trimmedDesc = description.trim();
  if (trimmedDesc.length === 0) return { valid: true };
  if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, message: `설명은 최대 ${MAX_DESCRIPTION_LENGTH}자 이하여야 합니다.` };
  }
  return { valid: true };
};

// 전체 프로필 검사: 이름, 성별, 생년월일 및 나이/미래 날짜 체크
export const validateFullProfile = (
  name: string,
  gender: string,
  year: string,
  month: string,
  day: string,
  paradoxFlag: boolean,
): { valid: boolean; message?: string; requiresOverride?: boolean } => {
  const nameValidation = validateName(name);
  if (!nameValidation.valid) return nameValidation;

  const birthValidation = validateBirthDate(year, month, day);
  if (!birthValidation.valid) return birthValidation;

  const genderValidation = validateGender(gender);
  if (!genderValidation.valid) return genderValidation;

  const y = parseInt(year.trim(), 10);
  const m = parseInt(month.trim(), 10);
  const d = parseInt(day.trim(), 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { valid: false, message: "생년월일이 올바르지 않습니다." };
  }
  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) {
    age--;
  }
  if (!paradoxFlag && (age > 130 || birthDate.getTime() > today.getTime())) {
    const message =
      birthDate.getTime() > today.getTime()
        ? "미래에서 온 당신, 타임머신은 아직 불법입니다!"
        : "너무 오래 살 수는 없습니다. 당신은 영원히 젊어야 해요!";
    return { valid: false, message, requiresOverride: true };
  }
  return { valid: true };
};

// 프로필 수정 업데이트 검사: 이름이나 프로필 사진 변경 여부 확인
export const validateUpdateProfile = (
  originalName: string,
  updatedName: string,
  newProfilePicture?: File | null,
): { valid: boolean; message?: string } => {
  // 이름 정규화 후 비교, 프로필 사진 변경 없으면 변경된 내용 없음
  if (normalizeName(originalName) === normalizeName(updatedName) && !newProfilePicture) {
    return { valid: false, message: "변경된 내용이 없습니다." };
  }
  const nameValidation = validateName(updatedName);
  if (!nameValidation.valid) {
    return nameValidation;
  }
  return { valid: true };
};
