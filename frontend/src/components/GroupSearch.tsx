// /frontend/src/components/GroupSearch.tsx

import React, { useState } from "react";
import { searchGroups, GroupInfo } from "../services/groupService";
import Icons from "./Icons";
import GroupProfile from "./GroupProfile";
import MatchingGroups from "./MatchingGroups";

interface GroupSearchProps {
  userUuid: string;
}

const GroupSearch: React.FC<GroupSearchProps> = ({ userUuid }) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<GroupInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const results = await searchGroups(searchKeyword);
      setSearchResults(results);
    } catch (error: any) {
      setSearchError(error.message || "검색 실패");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    // 부모 컨테이너에 배경색 없음 (원래대로)
    <div className="p-6">
      {/* 데스크톱(md 이상): 좌측은 검색 영역, 우측은 추천 그룹 영역 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 좌측: 그룹 검색 영역 */}
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-6">그룹 검색</h1>
          <div className="flex items-center gap-2 mb-6">
            <input
              type="text"
              placeholder="그룹명 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent 
                         focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 
                         transition-all duration-300 ease-in-out"
            />
            <button
              onClick={handleSearch}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              <Icons name="search" className="w-6 h-6" />
            </button>
          </div>

          {/* 검색 결과 */}
          {searchLoading ? (
            <div className="flex justify-center">
              <Icons name="spinner" className="animate-spin w-6 h-6 text-gray-200 fill-blue-600" />
            </div>
          ) : searchError ? (
            <div className="text-center text-red-500">{searchError}</div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {searchResults.map((group) => (
                <div
                  key={group.uuid}
                  onClick={() => setSelectedGroup(group)}
                  className="relative bg-white shadow rounded p-4 cursor-pointer transition-all 
                             duration-200 border border-gray-200 hover:ring-2 hover:ring-indigo-400 hover:bg-indigo-50"
                >
                  <div className="flex items-center gap-4">
                    {group.group_icon ? (
                      <img
                        src={group.group_icon}
                        alt={group.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full" />
                    )}
                    <div>
                      <p className="text-lg font-bold truncate">{group.name}</p>
                      <p className="text-sm text-gray-500 truncate">{group.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우측: 추천 그룹 영역 */}
        <div className="w-full md:w-1/2">
          <MatchingGroups userUuid={userUuid} />
        </div>
      </div>

      {selectedGroup && (
        <GroupProfile group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}
    </div>
  );
};

export default GroupSearch;
