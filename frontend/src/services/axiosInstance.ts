// /frontend/src/services/axiosInstance.ts
import axios from "axios";

// 모든 요청에 쿠키 및 자격 증명을 포함하도록 전역 설정
axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default axiosInstance;
