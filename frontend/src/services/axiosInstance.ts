// /frontend/src/services/axiosInstance.ts
import axios, { AxiosError } from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // 쿠키 및 자격증명 포함
  timeout: 15000, // 타임아웃 15초
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let errorMessage = "알 수 없는 오류가 발생했습니다.";
    if (error.response) {
      const errorData = (error.response.data as { message?: string }) || {};
      errorMessage = errorData.message ?? errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    if (import.meta.env.DEV) {
      console.error("API Error:", error);
    }
    return Promise.reject(new Error(errorMessage));
  },
);

export default axiosInstance;
