// /src/utils/validators.ts

import validator from 'validator';

export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 60;

export const validateEmail = (email: string): boolean => {
  return (
    typeof email === 'string' &&
    email.length >= MIN_EMAIL_LENGTH &&
    email.length <= MAX_EMAIL_LENGTH &&
    validator.isEmail(email)
  );
};

export const validatePassword = (
  password: string
): { valid: boolean; message?: string } => {
  if (typeof password !== 'string') {
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
