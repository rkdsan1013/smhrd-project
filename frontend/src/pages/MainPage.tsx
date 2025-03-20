// frontend/src/pages/MainPage.tsx
import React from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { useUserProfile } from "../hooks/useUserProfile";

const MainPage: React.FC = () => {
  const { userUuid } = useUser();
  const { profile, loading, error } = useUserProfile();

  // 로그아웃 버튼 클릭 시 실행되는 핸들러
  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
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
        <section className="mb-6">
          <p className="text-gray-600 text-lg">
            Welcome back! Here’s what’s happening:
          </p>
          <p className="mt-4 text-gray-800">
            <span className="font-mono">{userUuid || "No UUID"}</span>
          </p>
        </section>

        {/* 프로필 정보 표시 섹션 */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">내 프로필 정보</h2>
          {loading && <p className="text-blue-500">프로필 로딩 중...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {profile && (
            <div className="flex items-center bg-gray-50 p-4 rounded-lg shadow">
              <div className="w-16 h-16 mr-4">
                <img
                  src={
                    profile.profile_picture ||
                    "https://via.placeholder.com/64?text=Avatar"
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-xl text-gray-800 font-semibold">
                  {profile.name || "사용자 이름 없음"}
                </p>
                <p className="text-gray-600">{profile.email || "이메일 없음"}</p>
                <p className="text-sm text-gray-500">
                  UUID: {profile.uuid || "알 수 없음"}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MainPage;