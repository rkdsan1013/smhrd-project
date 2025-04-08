// /frontend/src/components/GroupProfile.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { getUserProfileWithStatus } from "../services/userService";
import { GroupInfo, getMyGroups } from "../services/groupService";
import { useUser } from "../contexts/UserContext";
import { initializeSocket } from "../services/socket";

const socket = initializeSocket();

interface GroupProfileProps {
  onClose: () => void;
  group: GroupInfo; // 그룹 생성 시 저장된 그룹 리더 uuid 포함
}

const GroupProfile: React.FC<GroupProfileProps> = ({ onClose, group }) => {
  const [groupLeader, setGroupLeader] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { userUuid } = useUser();

  // fade‑in 효과 적용
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 그룹 리더 프로필 조회
  useEffect(() => {
    if (group.group_leader_uuid) {
      getUserProfileWithStatus(group.group_leader_uuid)
        .then((profile) => setGroupLeader(profile))
        .catch((error) => {
          console.error("그룹장 프로필 조회 실패:", error);
        });
    }
  }, [group.group_leader_uuid]);

  // 현재 사용자의 그룹 가입 여부 확인
  useEffect(() => {
    getMyGroups()
      .then((groups) => {
        const member = groups.some((g) => g.uuid === group.uuid);
        if (member) setIsMember(true);
      })
      .catch((error) => {
        console.error("멤버십 상태 확인 실패:", error);
      });
  }, [group.uuid]);

  // 모달 닫기: fade‑out 후 onClose 호출
  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 그룹 참여 처리 (실시간 소켓 이벤트)
  const handleJoinGroup = () => {
    socket.emit("joinGroup", { groupUuid: group.uuid, userUuid }, (response: any) => {
      console.log("joinGroup 응답:", response);
      if (response.success) {
        setIsMember(true);
      } else {
        console.error("그룹 참여 실패:", response.message);
        if (response.message === "이미 그룹의 멤버입니다.") {
          setIsMember(true);
        }
      }
    });
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      {/* Background Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Container with fade‑in/out 효과 */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 overflow-hidden transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate whitespace-nowrap">{group.name}</h2>
          </div>
          <button
            onClick={handleModalClose}
            className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-200 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 배경 이미지 영역 */}
        <div className="h-60">
          {group.group_picture ? (
            <img
              src={group.group_picture}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        {/* 콘텐츠 영역 - 그룹장 정보 및 그룹 설명 */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            {groupLeader && groupLeader.profilePicture ? (
              <img
                src={groupLeader.profilePicture}
                alt={groupLeader.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
            )}
            <p className="text-lg font-semibold truncate">
              {groupLeader ? groupLeader.name : "그룹장 정보를 불러오는 중..."}
            </p>
          </div>
          <div className="mt-6 text-left">
            <p className="text-base text-gray-700">
              {group.description ? group.description : "그룹 설명이 없습니다."}
            </p>
          </div>
        </div>

        {/* Footer 영역 - 그룹 참여 버튼 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={!isMember ? handleJoinGroup : undefined}
            disabled={isMember}
            className={`w-full h-10 rounded-lg text-sm ${
              isMember
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isMember ? "그룹원 입니다" : "그룹 참여"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GroupProfile;
