// /frontend/src/components/GroupSearch.tsx

import React, { useState } from "react";
import { searchGroups, GroupInfo } from "../services/groupService";
import Icons from "./Icons";
import GroupProfile from "./GroupProfile";

const GroupSearch: React.FC = () => {
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">그룹 검색</h1>
      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="그룹명 검색"
          className="peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out"
        />
        <button
          onClick={handleSearch}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          <Icons name="search" className="w-6 h-6" />
        </button>
      </div>
      {searchLoading ? (
        <div className="flex justify-center">
          <Icons name="spinner" className="animate-spin w-6 h-6 text-gray-200 fill-blue-600" />
        </div>
      ) : searchError ? (
        <p className="text-center text-red-500">{searchError}</p>
      ) : searchResults.length === 0 ? (
        <p className="text-center text-gray-500">검색 결과가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {searchResults.map((group) => (
            <li
              key={group.uuid}
              className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex-shrink-0">
                {group.group_icon ? (
                  <img
                    src={group.group_icon}
                    alt={group.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800">{group.name}</p>
                <p className="text-sm text-gray-500">{group.description}</p>
              </div>
              <div>
                <Icons name="chevron-right" className="w-6 h-6 text-gray-400" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {selectedGroup && (
        <GroupProfile group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}
    </div>
  );
};

export default GroupSearch;
