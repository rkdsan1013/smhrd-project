// /frontend/src/services/apiClient.ts
import axiosInstance from "./axiosInstance";

// GET 요청 공통 유틸리티
export const get = async <T>(url: string, config?: object): Promise<T> => {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
};

// POST 요청 공통 유틸리티
export const post = async <T>(url: string, payload?: any, config?: object): Promise<T> => {
  const response = await axiosInstance.post<T>(url, payload, config);
  return response.data;
};
