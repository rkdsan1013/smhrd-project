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
      window.location.href = "/groups"; // useNavigate 대체
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">그룹 설정</h2>
      <div className="space-y-4">
        <p>
          <strong>그룹 이름:</strong> {group.name}
        </p>
        <p>
          <strong>설명:</strong> {group.description || "없음"}
        </p>
        <p>
          <strong>공개 여부:</strong> {group.visibility === "public" ? "공개" : "비공개"}
        </p>
      </div>

      {!isGroupLeader && (
        <div className="mt-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "처리 중..." : "그룹 탈퇴"}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">그룹 탈퇴</h3>
            <p className="mb-4">
              정말로 <strong>{group.name}</strong> 그룹에서 탈퇴하시겠습니까?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200"
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
