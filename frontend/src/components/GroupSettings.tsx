// /frontend/src/components/GroupSettings.tsx

import React, { useState } from "react";
import { leaveGroup } from "../services/groupService";

interface GroupSettingsProps {
  group: {
    uuid: string;
    name: string;
    description: string;
    group_icon: string;
    group_picture: string;
    visibility: string;
    group_leader_uuid: string;
    created_at: string;
    updated_at: string;
  };
  currentUserUuid: string;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({ group, currentUserUuid }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLeaveGroup = async () => {
    setLoading(true);
    setError(null);
    try {
      await leaveGroup(group.uuid);
      console.log(`[GroupSettings] 그룹 탈퇴 성공: ${group.uuid}`);
      window.location.href = "/groups";
    } catch (error: any) {
      const errMsg = error.data?.message || "그룹 탈퇴에 실패했습니다.";
      setError(errMsg);
      console.error(`[GroupSettings] 그룹 탈퇴 실패: ${error.message}`);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const isGroupLeader = currentUserUuid === group.group_leader_uuid;

  return (
    // h-full과 overflow-y-auto를 추가하여 컨텐츠가 화면을 벗어나면 스크롤하도록 설정
    <div className="max-w-3xl mx-auto p-6 h-full overflow-y-auto">
      {/* 헤더 영역: 그룹 프로필 이미지 및 기본 정보 */}
      <div className="flex items-center space-x-4 mb-8">
        {group.group_picture ? (
          <img
            src={group.group_picture}
            alt={group.name}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-white">
            {group.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{group.description || "설명이 없습니다."}</p>
        </div>
      </div>

      {/* 그룹 상세 정보 카드 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">그룹 상세 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700">
              <span className="font-medium">그룹 ID:</span> {group.uuid}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-medium">공개 여부:</span>{" "}
              {group.visibility === "public" ? "공개" : "비공개"}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-medium">생성일:</span>{" "}
              {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-medium">최근 업데이트:</span>{" "}
              {new Date(group.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 회원/관리자 액션 영역 */}
      {!isGroupLeader ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">회원 행동</h2>
          <p className="mb-4 text-gray-700">
            그룹을 탈퇴하면 그룹의 채팅방 및 관련 모든 정보를 더 이상 이용할 수 없습니다.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "처리 중..." : "그룹 탈퇴"}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">관리자 설정</h2>
          <p className="text-gray-700">본 그룹의 리더로서 여러 설정을 관리할 수 있습니다.</p>
          {/* 관리자가 사용할 기능들을 여기에 추가할 수 있습니다. */}
        </div>
      )}

      {/* 탈퇴 확인 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-2xl font-semibold mb-4">그룹 탈퇴 확인</h3>
            <p className="mb-6">
              정말로 <span className="font-bold">{group.name}</span> 그룹에서 탈퇴하시겠습니까?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-200"
              >
                취소
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "처리 중..." : "탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettings;
