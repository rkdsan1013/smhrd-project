// /frontend/src/pages/MainPage.tsx
import React from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const MainPage: React.FC = () => {
  const { userUuid } = useUser();

  // 로그아웃 버튼 클릭 시 실행되는 핸들러
  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출 (withCredentials 옵션 필수)
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      // 로그아웃 후 custom event 발생
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <header className="flex items-center justify-between py-4 border-b border-gray-300 mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          로그아웃
        </button>
      </header>
      <main>
        <p className="text-gray-600 text-lg">Welcome back! Here’s what’s happening:</p>
        <p className="mt-4 text-gray-800">
          <span className="font-mono">{userUuid || "No UUID"}</span>
        </p>
        {/* 실제 대시보드 콘텐츠를 여기에 추가 */}
      </main>
    </div>
  );
};

export default MainPage;