// /frontend/src/components/MatchingGroups.tsx

import React, { useState, useEffect } from "react";
import { MatchingGroupInfo, getMatchingGroups } from "../services/matchingGroupService";
import Icons from "./Icons";
import GroupProfile from "./GroupProfile";

interface MatchingGroupsProps {
  userUuid: string;
}

const MatchingGroups: React.FC<MatchingGroupsProps> = ({ userUuid }) => {
  const [matchingGroups, setMatchingGroups] = useState<MatchingGroupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<MatchingGroupInfo | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const fetchMatchingGroups = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("추천 그룹 가져오기 시작");
        const groups = await getMatchingGroups(userUuid);
        console.log("받아온 추천 그룹 수:", groups.length);
        setMatchingGroups(groups);
      } catch (error: any) {
        console.error("추천 그룹 조회 오류:", error);
        setError(error.message || "추천 그룹을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingGroups();
  }, [userUuid, refreshCount]);

  // 그룹 프로필 닫으면 목록 새로고침
  const handleCloseGroupProfile = () => {
    setSelectedGroup(null);
    setRefreshCount((prev) => prev + 1);
  };

  // 새로고침 버튼 핸들러
  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  // 이미 가입한 그룹 필터링 (임시 조치)
  const filterJoinedGroups = async () => {
    try {
      const { getMyGroups } = await import("../services/groupService");
      const myGroups = await getMyGroups();
      const myGroupIds = myGroups.map((g) => g.uuid);

      setMatchingGroups((prev) => prev.filter((group) => !myGroupIds.includes(group.uuid)));
    } catch (error) {
      console.error("그룹 필터링 실패:", error);
    }
  };

  // 최초 마운트 시 필터링 시도
  useEffect(() => {
    if (matchingGroups.length > 0) {
      filterJoinedGroups();
    }
  }, [matchingGroups.length]);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">추천 그룹</h2>
        <button
          onClick={handleRefresh}
          className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
        >
          <span className="mr-1">새로고침</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Icons name="spinner" className="animate-spin w-6 h-6 text-gray-200 fill-blue-600" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : matchingGroups.length === 0 ? (
        <p className="text-center text-gray-500">추천 그룹이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {matchingGroups.map((group) => (
            <li
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
                  {group.description && (
                    <p className="text-sm text-gray-500 truncate">{group.description}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedGroup && (
        <GroupProfile group={selectedGroup as any} onClose={handleCloseGroupProfile} />
      )}
    </div>
  );
};

export default MatchingGroups;
