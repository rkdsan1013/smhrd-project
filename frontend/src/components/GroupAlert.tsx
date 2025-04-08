// /frontend/src/components/GroupAlert.tsx

import React from "react";
import Icons from "./Icons";
import { post } from "../services/apiClient";

interface GroupInvite {
  inviteUuid: string;
  groupUuid: string;
  groupName: string;
  inviterName: string;
  inviterUuid: string;
}

interface GroupAlertProps {
  invitations: GroupInvite[];
  onClose: (inviteUuid: string) => void;
}

const GroupAlert: React.FC<GroupAlertProps> = ({ invitations, onClose }) => {
  if (!invitations.length) return null;

  // ✅ 수락 또는 거절 응답 처리
  const handleRespond = async (inviteUuid: string, action: "accept" | "decline") => {
    try {
      await post("/groups/invite/respond", { inviteUuid, action });
      onClose(inviteUuid); // 상태에서 제거
    } catch (err) {
      console.error("그룹 초대 응답 실패:", err);
      alert("초대 응답 처리 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="w-96 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-500 flex items-center">
          <Icons name="bell" className="w-6 h-6 mr-2" />
          그룹 초대 알림
        </h3>
        <button
          onClick={() => {
            // 전체 닫기 기능 필요 시 여기에 구현 가능
          }}
          className="hover:bg-gray-100 p-1 rounded-full"
        >
          <Icons name="close" className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto space-y-2">
        {invitations.map((invite) => (
          <div key={invite.inviteUuid} className="border p-3 rounded-md shadow-sm">
            <p className="text-sm font-medium">{invite.inviterName}님이</p>
            <p className="text-base font-semibold text-blue-600">{invite.groupName}</p>
            <p className="text-sm">그룹에 초대했어요!</p>
            <div className="mt-2 text-right space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                onClick={() => handleRespond(invite.inviteUuid, "accept")}
              >
                수락
              </button>
              <button
                className="px-3 py-1 text-sm text-gray-700 border rounded hover:bg-gray-100"
                onClick={() => handleRespond(invite.inviteUuid, "decline")}
              >
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupAlert;
