import React, { useEffect, useState } from "react";
import { getGroupMembers, Member, GroupMembersResponse } from "../services/groupService";
import UserProfileCard from "./UserProfileCard";
import ProfileCard from "./ProfileCard";
import { useUser } from "../contexts/UserContext";
import Icons from "./Icons";
import { useSocket } from "../contexts/SocketContext";

interface GroupMemberListProps {
  groupUuid: string;
}

const GroupMemberList: React.FC<GroupMemberListProps> = ({ groupUuid }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberUuid, setSelectedMemberUuid] = useState<string | null>(null);
  const { userUuid } = useUser();
  const { socket } = useSocket();

  // 멤버 목록 불러오기
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const data: GroupMembersResponse = await getGroupMembers(groupUuid);
        let sortedMembers = data.members.sort((a, b) => a.name.localeCompare(b.name));
        if (userUuid) {
          const myMember = sortedMembers.find((member) => member.uuid === userUuid);
          if (myMember) {
            sortedMembers = sortedMembers.filter((member) => member.uuid !== userUuid);
            sortedMembers.unshift(myMember);
          }
        }
        setMembers(sortedMembers);
      } catch (err) {
        console.error("멤버 불러오기 실패:", err);
        setError("멤버들을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupUuid, userUuid]);

  // 소켓 이벤트: 멤버 탈퇴
  useEffect(() => {
    if (!socket) return;

    const handleGroupMemberLeft = ({
      groupUuid: eventGroupUuid,
      userUuid: leftUserUuid,
    }: {
      groupUuid: string;
      userUuid: string;
    }) => {
      if (eventGroupUuid === groupUuid) {
        setMembers((prev) => prev.filter((member) => member.uuid !== leftUserUuid));
      }
    };

    socket.on("groupMemberLeft", handleGroupMemberLeft);

    return () => {
      socket.off("groupMemberLeft", handleGroupMemberLeft);
    };
  }, [socket, groupUuid]);

  const handleMemberClick = (memberUuid: string) => setSelectedMemberUuid(memberUuid);
  const handleClose = () => setSelectedMemberUuid(null);

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <Icons name="spinner" className="w-8 h-8 text-gray-300 fill-blue-600 animate-spin" />
      </div>
    );
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Icons name="userGroup" className="w-6 h-6" />
        <span className="text-xl font-semibold">{members.length}</span>
      </div>
      <div className="border-b border-gray-300 mb-4"></div>
      <ul className="space-y-3 flex-grow overflow-y-auto no-scrollbar">
        {members.map((member) => (
          <li
            key={member.uuid}
            className="flex items-center justify-center lg:justify-start cursor-pointer hover:bg-gray-100 transition-colors duration-300 p-2 rounded"
            onClick={() => handleMemberClick(member.uuid)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-0 lg:mr-3">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.name}의 프로필`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
              )}
            </div>
            <span className="hidden lg:block truncate whitespace-nowrap">{member.name}</span>
          </li>
        ))}
      </ul>
      {selectedMemberUuid &&
        (selectedMemberUuid === userUuid ? (
          <ProfileCard onClose={handleClose} />
        ) : (
          <UserProfileCard targetUuid={selectedMemberUuid} onClose={handleClose} />
        ))}
    </div>
  );
};

export default GroupMemberList;
