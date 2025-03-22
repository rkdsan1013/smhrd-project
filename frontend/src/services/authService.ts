// /frontend/src/services/authService.ts
import axios from "axios";
import axiosInstance from "./axiosInstance";

// 인증 응답 인터페이스
export interface AuthResponse {
  success: boolean;
  user?: { uuid: string; email: string };
}

// API 에러 처리 함수
function handleApiError(error: any): never {
  const message =
    axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : "알 수 없는 오류가 발생했습니다.";
  throw new Error(message);
}

// 이메일 중복 확인 함수
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post<{ exists: boolean }>("/auth/check-email", { email });
    return data.exists;
  } catch (error) {
    return handleApiError(error);
  }
};

// 로그인 처리 함수
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/sign-in", { email, password });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

// 회원가입 처리 함수 (FormData 사용)
export const signUp = async (payload: FormData): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/sign-up", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

// 토큰 갱신 함수 (renewRefresh 옵션)
export const refreshTokens = async (renewRefresh: boolean): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/refresh", { renewRefresh });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};
