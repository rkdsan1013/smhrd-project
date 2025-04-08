// /frontend/src/components/GroupMemberList.tsx

import React, { useEffect, useState } from "react";
import { getGroupMembers, Member, GroupMembersResponse } from "../services/groupService";
import UserProfileCard from "./UserProfileCard";

interface GroupMemberListProps {
  groupUuid: string;
}

const GroupMemberList: React.FC<GroupMemberListProps> = ({ groupUuid }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberUuid, setSelectedMemberUuid] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data: GroupMembersResponse = await getGroupMembers(groupUuid);
        setMembers(data.members);
      } catch (err) {
        console.error("멤버 불러오기 실패:", err);
        setError("멤버들을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupUuid]);

  const handleMemberClick = (memberUuid: string) => {
    setSelectedMemberUuid(memberUuid);
  };

  const handleClose = () => {
    setSelectedMemberUuid(null);
  };

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">멤버 리스트</h2>
      <ul className="space-y-3 flex-grow">
        {members.map((member) => (
          <li
            key={member.uuid}
            className="flex items-center cursor-pointer hover:bg-gray-100 transition-colors duration-300 p-2 rounded"
            onClick={() => handleMemberClick(member.uuid)}
          >
            <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
              )}
            </div>
            <span>{member.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={() => console.log("초대 버튼 클릭됨")}
          className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-all duration-300"
        >
          초대
        </button>
      </div>
      {selectedMemberUuid && (
        <UserProfileCard targetUuid={selectedMemberUuid} onClose={handleClose} />
      )}
    </div>
  );
};

export default GroupMemberList;
