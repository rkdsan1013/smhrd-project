// /backend/src/utils/validators.js
const validator = require('validator');

const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60;

// 이메일 유효성 검사 함수
const validateEmail = (email) => {
  if (typeof email !== 'string' || email.trim() === '') {
    return { valid: false, message: '이메일을 입력해주세요.' };
  }
  if (!validator.isEmail(email) || email.length < MIN_EMAIL_LENGTH || email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, message: '유효한 이메일 주소를 입력해주세요.' };
  }
  return { valid: true };
};

// 비밀번호 유효성 검사 함수
const validatePassword = (password) => {
  if (typeof password !== 'string' || password.trim() === '') {
    return { valid: false, message: '비밀번호를 입력해주세요.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.`,
    };
  }
  if (!validator.isAscii(password)) {
    return {
      valid: false,
      message: '비밀번호는 ASCII 문자만 사용 가능합니다.',
    };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  MIN_EMAIL_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};