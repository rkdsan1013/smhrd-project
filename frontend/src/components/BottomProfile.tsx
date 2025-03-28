import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUserProfile, IUserProfile } from "../hooks/useUserProfile";

const BottomProfile: React.FC = () => {
  const { profile } = useUserProfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  const [friends, setFriends] = useState<{ uuid: string; name: string }[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<IUserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const friendListRef = useRef<HTMLDivElement>(null);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setIsFriendListOpen(false);
  };

  const friendListClick = () => {
    setIsFriendListOpen(!isFriendListOpen);
    setIsSettingsOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("profile_picture", selectedFile);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/profile/picture`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setSelectedFile(null);
    } catch (error) {
      console.error("사진 업로드 실패:", error);
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/friends/${profile?.uuid}`, {
          withCredentials: true,
        });
        setFriends(res.data.friends);
      } catch (error) {
        console.error("친구 목록 조회 실패:", error);
      }
    };
    if (profile?.uuid) fetchFriends();
  }, [profile?.uuid]);

  const handleFriendClick = async (friendUuid: string) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${friendUuid}`, {
        withCredentials: true,
      });
      setSelectedFriend(res.data.profile);
    } catch (error) {
      console.error("친구 정보 조회 실패:", error);
    }
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
      {isSettingsOpen ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-700 text-lg">설정 화면 (미구현)</p>
        </div>
      ) : (
        <div className="flex items-center relative w-full">
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => document.getElementById("profilePicInput")?.click()}
            >
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">사진</span>
              )}
            </div>
            <input
              id="profilePicInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <button
                onClick={handleUpload}
                className="py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                업로드
              </button>
            )}
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-gray-800 font-semibold">{profile?.name || "홍길동"}</p>
                <p className="text-gray-600 text-sm">{profile?.email || "hong.gildong@example.com"}</p>
              </div>
              <button
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                onClick={handleSettingsClick}
              >
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
              <button
                className="w-30 py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200 focus:outline-none"
                onClick={friendListClick}
              >
                친구 목록
              </button>
            </div>
          </div>
          {isFriendListOpen && (
            <div
              ref={friendListRef}
              className="absolute right-0 bottom-16 w-64 bg-white shadow-lg rounded-lg p-4 max-h-64 overflow-y-auto"
            >
              <h3 className="text-lg font-semibold mb-2">친구 목록</h3>
              <ul className="space-y-2">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <li
                      key={friend.uuid}
                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleFriendClick(friend.uuid)}
                    >
                      {friend.name}
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-gray-500">친구가 없습니다.</li>
                )}
              </ul>
            </div>
          )}
          {selectedFriend && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-lg font-bold mb-4">{selectedFriend.name}</h2>
                <p>Email: {selectedFriend.email}</p>
                {selectedFriend.profile_picture && (
                  <img
                    src={selectedFriend.profile_picture}
                    alt="Friend Profile"
                    className="w-24 h-24 rounded-full mt-2"
                  />
                )}
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="mt-4 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BottomProfile;