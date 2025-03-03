// authService.ts

import axios from 'axios';
import validator from 'validator';

const API_URL = process.env.REACT_APP_API_URL || '';

const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60;

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

export const checkEmailExists = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/check-email`, { email });
    return response.data.exists;
  } catch (error) {
    handleAxiosError(error);
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/sign-in`, {
      email,
      password,
    });
    return response.data.success;
  } catch (error) {
    handleAxiosError(error);
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/sign-up`, {
      email,
      password,
    });
    return response.data.success;
  } catch (error) {
    handleAxiosError(error);
  }
};

const handleAxiosError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response?.data) {
    throw new Error(error.response.data.message || '알 수 없는 오류가 발생했습니다.');
  }
  throw new Error('알 수 없는 오류가 발생했습니다.');
};
