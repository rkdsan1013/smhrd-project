// /frontend/src/components/GroupMemberList.tsx

import React, { useEffect, useState } from "react";
import { getGroupMembers, Member, GroupMembersResponse } from "../services/groupService";
import { fetchFriendList, Friend } from "../services/friendService";
import UserProfileCard from "./UserProfileCard";
import { useUser } from "../contexts/UserContext";
import Icons from "./Icons";

interface GroupMemberListProps {
  groupUuid: string;
}

const GroupMemberList: React.FC<GroupMemberListProps> = ({ groupUuid }) => {
  // inviteMode가 false이면 그룹 멤버 리스트, true이면 초대(내 친구) 리스트를 표시
  const [inviteMode, setInviteMode] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMemberUuids, setGroupMemberUuids] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberUuid, setSelectedMemberUuid] = useState<string | null>(null);

  // 현재 로그인한 사용자의 uuid (UserContext)
  const { userUuid } = useUser();

  // 그룹에 이미 가입한 멤버들의 UUID 불러오기 (초대 모드에서 친구 목록 필터링용)
  useEffect(() => {
    const fetchGroupMemberUuids = async () => {
      try {
        const data: GroupMembersResponse = await getGroupMembers(groupUuid);
        const uuids = data.members.map((member) => member.uuid);
        setGroupMemberUuids(uuids);
      } catch (err) {
        console.error("그룹 멤버 UUID 불러오기 실패:", err);
      }
    };
    fetchGroupMemberUuids();
  }, [groupUuid]);

  // 데이터 불러오기 및 정렬
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        if (inviteMode) {
          // 초대 모드: 내 친구 목록 중 이미 그룹에 속한 친구 제외 후 이름순 정렬
          const friendList: Friend[] = await fetchFriendList();
          const filteredFriends = friendList.filter(
            (friend) => !groupMemberUuids.includes(friend.uuid),
          );
          const sortedFriends = filteredFriends.sort((a, b) => a.name.localeCompare(b.name));
          setMembers(sortedFriends);
        } else {
          // 기본 모드: 그룹 멤버 목록 불러오고 이름순 정렬, 현재 사용자가 있다면 최상단에 배치
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
        }
      } catch (err) {
        console.error("멤버 불러오기 실패:", err);
        setError("멤버들을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupUuid, inviteMode, groupMemberUuids, userUuid]);

  // 리스트 항목 클릭 시 프로필 카드 표시
  const handleMemberClick = (memberUuid: string) => {
    setSelectedMemberUuid(memberUuid);
  };

  // 프로필 카드 닫기
  const handleClose = () => {
    setSelectedMemberUuid(null);
  };

  // 초대 모드 토글
  const handleToggleInviteMode = () => {
    setInviteMode((prev) => !prev);
  };

  // 초대장 보내기 (추후 API 연동)
  const handleInvite = (friendUuid: string) => {
    console.log(`${friendUuid} 에게 초대장을 보냈습니다.`);
    alert("초대장이 전송되었습니다.");
  };

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">{inviteMode ? "초대" : "멤버 리스트"}</h2>
      {/*
          각 리스트 아이템은 화면이 작을 때(예: lg 미만)에는 내부 내용이 가운데 정렬되도록 
          'justify-center lg:justify-between' 클래스를 사용합니다.
          스크롤은 숨기되 가능하도록 no-scrollbar 클래스도 적용했습니다.
      */}
      <ul className="space-y-3 flex-grow overflow-y-auto no-scrollbar">
        {members.map((member) => (
          <li
            key={member.uuid}
            className="flex items-center justify-center lg:justify-between cursor-pointer hover:bg-gray-100 transition-colors duration-300 p-2 rounded"
          >
            {inviteMode ? (
              // 초대 모드: 프로필 사진, 이름, 초대 버튼을 하나의 그룹으로 묶어 가운데 정렬
              <div className="flex items-center justify-center w-full gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-center lg:justify-start">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
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
                  {/* 이름: lg 이상에서만 표시하고, max-width 제거하여 가용 공간에 따라 자동 축소 */}
                  <span className="hidden lg:block truncate whitespace-nowrap">{member.name}</span>
                </div>
                <button
                  onClick={() => handleInvite(member.uuid)}
                  className="w-10 h-10 bg-transparent rounded flex items-center justify-center transition-all duration-300"
                >
                  <Icons
                    name="userAdd"
                    className="w-6 h-6 text-gray-400 hover:text-blue-400 duration-300"
                  />
                </button>
              </div>
            ) : (
              // 기본 모드: 프로필 사진과 멤버 이름 (이름은 lg 이상에서만 보임)
              <div
                className="flex items-center justify-center lg:justify-start w-full min-w-0"
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
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={handleToggleInviteMode}
          className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-all duration-300"
        >
          {inviteMode ? "취소" : "초대"}
        </button>
      </div>
      {selectedMemberUuid && (
        <UserProfileCard targetUuid={selectedMemberUuid} onClose={handleClose} />
      )}
    </div>
  );
};

export default GroupMemberList;
