import React, { useState, useEffect, useRef } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFriends } from "../hooks/useFriends";

const BottomProfile: React.FC = () => {
  const { profile } = useUserProfile();
  const { friends, loading, error, loadFriends } = useFriends(profile?.uuid || "");
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  const friendListRef = useRef<HTMLDivElement>(null);

  const friendListClick = () => {
    if (!isFriendListOpen) {
      loadFriends();
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
              <img
                src={profile.profile_picture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-sm">사진</span>
            )}
          </div>
          <div>
            <p className="text-gray-800 font-semibold">{profile?.name || "홍길동"}</p>
            <p className="text-gray-600 text-sm">{profile?.email || "hong.gildong@example.com"}</p>
          </div>
        </div>
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
              <ul className="space-y-2">
                {friends.map((friend) => (
                  <li key={friend.uuid} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {friend.profile_picture ? (
                        <img
                          src={friend.profile_picture}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {friend.name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-800">{friend.name}</span>
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
