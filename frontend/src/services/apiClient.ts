import axios, { AxiosError } from "axios";

// Axios Instance 설정
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
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

// GET 요청 유틸리티
export const get = async <T>(url: string, config?: object): Promise<T> => {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
};

// POST 요청 유틸리티
export const post = async <T>(url: string, payload?: any, config?: object): Promise<T> => {
  const response = await axiosInstance.post<T>(url, payload, config);
  return response.data;
};

export default axiosInstance;
