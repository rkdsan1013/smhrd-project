// /frontend/src/pages/MainPage.tsx
import React, { useState } from "react";
import { get, post } from "../services/apiClient";
import { useUserProfile, IUserProfile } from "../hooks/useUserProfile";

const MainPage: React.FC = () => {
  const { profile, loading, error } = useUserProfile();
  const [searchUuid, setSearchUuid] = useState("");
  const [searchedProfile, setSearchedProfile] = useState<IUserProfile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await post("/auth/logout", {});
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  // 타 유저 프로필 검색 핸들러
  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchError("");
    try {
      const data = await get<{ success: boolean; profile: IUserProfile }>(`/users/${searchUuid}`);
      if (data.success) {
        setSearchedProfile(data.profile);
      } else {
        setSearchError("프로필 정보를 불러올 수 없습니다.");
        setSearchedProfile(null);
      }
    } catch (err) {
      console.error("프로필 검색 실패:", err);
      setSearchError("프로필 정보를 불러오는 데 실패했습니다.");
      setSearchedProfile(null);
    }
    setSearchLoading(false);
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
          <p className="text-gray-600 text-lg">Welcome back! Here’s what’s happening:</p>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">내 프로필 정보</h2>
          {loading && <p className="text-blue-500">프로필 로딩 중...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {profile && (
            <div className="flex items-center bg-gray-50 p-4 rounded-lg shadow mb-6">
              <div className="w-16 h-16 mr-4">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm rounded-full">
                    프로필
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl text-gray-800 font-semibold">
                  {profile.name || "사용자 이름 없음"}
                </p>
                <p className="text-gray-600">{profile.email || "이메일 없음"}</p>
                <p className="text-sm text-gray-500">UUID: {profile.uuid || "알 수 없음"}</p>
                <p className="text-gray-600">생년월일: {profile.birthdate || "정보 없음"}</p>
                <p className="text-gray-600">성별: {profile.gender || "정보 없음"}</p>
              </div>
            </div>
          )}
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">타 유저 프로필 검색</h2>
          <div className="flex items-center mb-4">
            <input
              type="text"
              placeholder="UUID 입력"
              value={searchUuid}
              onChange={(e) => setSearchUuid(e.target.value)}
              className="px-3 py-2 border rounded w-64 mr-4"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            >
              검색
            </button>
          </div>
          {searchLoading && <p className="text-blue-500">검색 중...</p>}
          {searchError && <p className="text-red-500">{searchError}</p>}
          {searchedProfile && (
            <div className="flex items-center bg-gray-50 p-4 rounded-lg shadow">
              <div className="w-16 h-16 mr-4">
                {searchedProfile.profile_picture ? (
                  <img
                    src={searchedProfile.profile_picture}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm rounded-full">
                    프로필
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl text-gray-800 font-semibold">
                  {searchedProfile.name || "사용자 이름 없음"}
                </p>
                <p className="text-gray-600">{searchedProfile.email || "이메일 없음"}</p>
                <p className="text-sm text-gray-500">
                  UUID: {searchedProfile.uuid || "알 수 없음"}
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
