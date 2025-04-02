import React, { useEffect, useState } from "react";
import { fetchFriendList, Friend } from "../services/friendService";
import { searchUsers, SearchResultUser } from "../services/friendService";

interface FriendListProps {
  onClose: () => void;
}

const FriendList: React.FC<FriendListProps> = ({ onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 친구 목록 불러오기
  useEffect(() => {
    if (!isAdding) {
      const loadFriends = async () => {
        try {
          setLoading(true);
          const res = await fetchFriendList();
          setFriends(res);
        } catch (err: any) {
          setError(err.message || "친구 목록 로드 실패");
        } finally {
          setLoading(false);
        }
      };
      loadFriends();
    }
  }, [isAdding]);

  // 친구 추가 모드에서 검색 버튼 클릭 시
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;

    try {
      setSearchLoading(true);
      setSearchError("");
      const results = await searchUsers(searchKeyword);
      setSearchResults(results);
    } catch (err: any) {
      setSearchError(err.message || "검색 실패");
    } finally {
      setSearchLoading(false);
    }
  };

  // 모드 전환
  const handleToggleMode = () => {
    setIsAdding((prev) => !prev);
    setSearchKeyword("");
    setSearchResults([]);
    setSearchError("");
  };

  // 친구 요청 (추후 구현)
  const handleSendFriendRequest = (targetUuid: string) => {
    alert(`친구 요청: ${targetUuid}`);
    // TODO: API 연동 예정
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold">{isAdding ? "친구 추가" : "친구 목록"}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
          ✕
        </button>
      </div>

      {/* 본문 */}
      <div className="p-4 max-h-72 overflow-y-auto">
        {isAdding ? (
          <div className="space-y-3">
            {/* 검색 입력 + 버튼 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="이메일 또는 이름으로 검색"
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                검색
              </button>
            </div>

            {/* 검색 결과 */}
            {searchLoading ? (
              <p className="text-center text-gray-500">검색 중...</p>
            ) : searchError ? (
              <p className="text-red-500 text-center">{searchError}</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">검색 결과 없음</p>
            ) : (
              <ul className="space-y-4">
                {searchResults.map((user) => (
                  <li key={user.uuid} className="flex items-center justify-between space-x-3">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.uuid)}
                      className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      친구 요청
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : loading ? (
          <p className="text-center text-gray-500 text-sm">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm">{error}</p>
        ) : friends.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">친구가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {friends.map((friend) => (
              <li key={friend.uuid} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-sm text-gray-500">{friend.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 모드 전환 버튼 */}
      <div className="p-4 border-t border-gray-100 text-right">
        <button
          onClick={handleToggleMode}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          {isAdding ? "친구 목록" : "친구 추가"}
        </button>
      </div>
    </div>
  );
};

export default FriendList;
