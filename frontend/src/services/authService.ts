// /src/services/authService.ts

import axios from 'axios';
import {
  validateEmail,
  validatePassword,
} from '../utils/validators'; // 유효성 검사 함수 임포트

const API_URL = process.env.REACT_APP_API_URL || '';

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
