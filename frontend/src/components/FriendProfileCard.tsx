// FriendProfileCard.tsx (수정본)
import React, { useEffect, useState, useRef } from "react";
import { getUserProfileByUuid } from "../services/friendService";

interface FriendProfileCardProps {
  uuid: string;
  onClose: () => void;
}

const FriendProfileCard: React.FC<FriendProfileCardProps> = ({ uuid, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfileByUuid(uuid);
        setProfile(data);
      } catch (error) {
        console.error("친구 프로필 조회 실패", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uuid]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleManageFriend = () => {
    alert("친구 관리 기능 준비 중");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-blue-500">로딩 중...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-red-500">
        프로필 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* 배경 */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* 카드 */}
      <div
        ref={outerRef}
        className={`relative bg-white rounded-lg shadow-xl w-96 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          position: "absolute",
        }}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">친구 프로필</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 mb-4">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="text-center w-full">
            <p className="text-lg font-semibold truncate">{profile.name}</p>
            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleManageFriend}
            className="px-4 py-2 text-sm rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            친구 관리
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendProfileCard;
