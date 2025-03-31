import React, { useState, useEffect, useRef } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFriends } from "../hooks/useFriends";

const BottomProfile: React.FC = () => {
  const { profile } = useUserProfile();
  const { friends, loading, error, loadFriends } = useFriends(profile?.uuid || ""); // 사용자 UUID
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  const friendListRef = useRef<HTMLDivElement>(null);

  const friendListClick = () => {
    if (!isFriendListOpen) {
      loadFriends(); // 친구 목록 열 때 데이터 가져오기
    }
    setIsFriendListOpen(!isFriendListOpen);
  };
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (friendListRef.current && !friendListRef.current.contains(event.target as Node)) {
        setIsFriendListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full h-16 bg-blue-200 p-4 rounded-b-2xl flex fixed bottom-0 left-0 right-0">
      <div className="flex items-center relative w-full">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {profile?.profile_picture ? (
              <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">사진</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-gray-800 font-semibold">{profile?.name || "홍길동"}</p>
                <p className="text-gray-600 text-sm">{profile?.email || "hong.gildong@example.com"}</p>
              </div>
              <button className="text-gray-600 hover:text-gray-800 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1 .608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* "친구 목록" 버튼을 우측 끝으로 이동 */}
        <div className="ml-auto">
          <button
            className="w-30 py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200 focus:outline-none"
            onClick={friendListClick}
          >
            친구 목록
          </button>
        </div>
        {isFriendListOpen && (
          <div
            ref={friendListRef}
            className="absolute right-0 bottom-16 w-64 bg-white shadow-lg rounded-lg p-4 max-h-64 overflow-y-auto"
          >
            <h3 className="text-lg font-semibold mb-2">친구 목록</h3>
            {loading && <p>로딩 중...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && friends.length === 0 && <p>친구가 없습니다.</p>}
            {!loading && !error && friends.length > 0 && (
              <ul>
                {friends.map((friend) => (
                  <li key={friend.uuid} className="py-1">
                    {friend.name} ({friend.uuid})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomProfile;