// /frontend/src/services/authService.ts

import { post, patch } from "./apiClient";

// 인증 응답 인터페이스
export interface AuthResponse {
  success: boolean;
  user?: { uuid: string; email: string };
}

// 비밀번호 변경 응답 인터페이스
export interface PasswordChangeResponse {
  success: boolean;
  message?: string;
}

// 회원 탈퇴 응답 인터페이스
export interface WithdrawResponse {
  success: boolean;
  message?: string;
}

// 이메일 중복 확인
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const data = await post<{ exists: boolean }>("/auth/check-email", { email });
  return data.exists;
};

// 로그인 처리
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  return post<AuthResponse>("/auth/sign-in", { email, password });
};

// 회원가입 처리 (FormData 사용)
export const signUp = async (payload: FormData): Promise<AuthResponse> => {
  return post<AuthResponse>("/auth/sign-up", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 토큰 갱신 처리 (renewRefresh 옵션)
export const refreshTokens = async (renewRefresh: boolean): Promise<AuthResponse> => {
  return post<AuthResponse>("/auth/refresh", { renewRefresh });
};

// 로그아웃 처리
export const logout = async (): Promise<{ success: boolean }> => {
  return post<{ success: boolean }>("/auth/logout", {});
};

// 비밀번호 변경 처리
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<PasswordChangeResponse> => {
  return patch<PasswordChangeResponse>("/auth/change-password", { currentPassword, newPassword });
};

// 회원 탈퇴 처리
export const withdrawAccount = async (password: string): Promise<WithdrawResponse> => {
  return post<WithdrawResponse>("/auth/withdraw", { password });
};
