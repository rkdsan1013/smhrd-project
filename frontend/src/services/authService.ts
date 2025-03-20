// /frontend/src/services/authService.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface AuthResponse {
  success: boolean;
  user?: { uuid: string; email: string };
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function handleApiError(error: any): never {
  const message =
    axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : "알 수 없는 오류가 발생했습니다.";
  throw new Error(message);
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post<{ exists: boolean }>("/auth/check-email", { email });
    return data.exists;
  } catch (error) {
    return handleApiError(error);
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/sign-in", { email, password });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/sign-up", { email, password });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const refreshTokens = async (renewRefresh: boolean): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/auth/refresh", { renewRefresh });
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};