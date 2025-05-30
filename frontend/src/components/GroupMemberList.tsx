// /frontend/src/components/GroupMemberList.tsx

import React, { useEffect, useState } from "react";
import {
  getGroupMembers,
  Member,
  GroupMembersResponse,
  getSentGroupInvites,
} from "../services/groupService";
import { fetchFriendList, Friend } from "../services/friendService";
import UserProfileCard from "./UserProfileCard";
import ProfileCard from "./ProfileCard";
import { useUser } from "../contexts/UserContext";
import Icons from "./Icons";
import { useSocket } from "../contexts/SocketContext";

interface GroupMemberListProps {
  groupUuid: string;
}

const GroupMemberList: React.FC<GroupMemberListProps> = ({ groupUuid }) => {
  const [inviteMode, setInviteMode] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMemberUuids, setGroupMemberUuids] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberUuid, setSelectedMemberUuid] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Record<string, string>>({});

  const { userUuid } = useUser();
  const { socket } = useSocket();

  // ✅ 초대 수락된 사용자 목록 (이 그룹 기준)
  const [acceptedUuids, setAcceptedUuids] = useState<string[]>([]);

  // 그룹 멤버 UUID 불러오기
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

  // 현재 그룹에서 내가 보낸 초대 목록 불러오기
  useEffect(() => {
    const fetchSentInvites = async () => {
      try {
        const sent = await getSentGroupInvites(groupUuid);
        const map: Record<string, string> = {};
        for (const item of sent) {
          map[item.invitedUserUuid] = item.inviteUuid;
        }
        setPendingInvites(map);
      } catch (err) {
        console.error("초대 목록 로딩 실패:", err);
      }
    };

    if (inviteMode) {
      fetchSentInvites();
    }
  }, [inviteMode, groupUuid]);

  // 초대 수락 소켓 수신 → 초대 리스트에서 제거
  useEffect(() => {
    if (!socket) return;

    const handleInviteAccepted = ({
      groupUuid: acceptedGroupUuid,
      invitedUserUuid,
    }: {
      groupUuid: string;
      invitedUserUuid: string;
      inviteUuid: string;
    }) => {
      if (acceptedGroupUuid !== groupUuid) return;
      setAcceptedUuids((prev) => [...prev, invitedUserUuid]);
      setPendingInvites((prev) => {
        const updated = { ...prev };
        delete updated[invitedUserUuid];
        return updated;
      });
    };

    socket.on("groupInviteAccepted", handleInviteAccepted);

    return () => {
      socket.off("groupInviteAccepted", handleInviteAccepted);
    };
  }, [socket, groupUuid]);

  // 멤버 or 친구 목록 불러오기
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        if (inviteMode) {
          const friendList: Friend[] = await fetchFriendList();

          const filteredFriends = friendList.filter((friend) => {
            return !groupMemberUuids.includes(friend.uuid) && !acceptedUuids.includes(friend.uuid);
          });

          const sortedFriends = filteredFriends.sort((a, b) => a.name.localeCompare(b.name));
          setMembers(sortedFriends);
        } else {
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
  }, [groupUuid, inviteMode, groupMemberUuids, userUuid, acceptedUuids]);

  const handleInviteAction = (friendUuid: string) => {
    if (!socket) return;

    if (pendingInvites[friendUuid]) {
      socket.emit(
        "cancelGroupInvite",
        {
          inviteUuid: pendingInvites[friendUuid],
          groupUuid,
          invitedUserUuid: friendUuid,
        },
        (response: any) => {
          if (response.success) {
            const updated = { ...pendingInvites };
            delete updated[friendUuid];
            setPendingInvites(updated);
          } else {
            console.error("초대 취소 실패:", response.message);
          }
        },
      );
    } else {
      socket.emit("inviteToGroup", { groupUuid, invitedUserUuid: friendUuid }, (response: any) => {
        if (response.success) {
          setPendingInvites((prev) => ({
            ...prev,
            [friendUuid]: response.inviteUuid,
          }));
        } else {
          console.error("초대 실패:", response.message);
        }
      });
    }
  };

  const handleMemberClick = (memberUuid: string) => setSelectedMemberUuid(memberUuid);
  const handleClose = () => setSelectedMemberUuid(null);
  const handleToggleInviteMode = () => setInviteMode((prev) => !prev);

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <Icons name="spinner" className="w-8 h-8 text-gray-300 fill-blue-600 animate-spin" />
      </div>
    );
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col h-full">
      {inviteMode ? (
        <h2 className="text-xl font-semibold mb-2">초대</h2>
      ) : (
        <div className="flex items-center gap-2 mb-2">
          <Icons name="userGroup" className="w-6 h-6" />
          <span className="text-xl font-semibold">{members.length}</span>
        </div>
      )}
      <div className="border-b border-gray-300 mb-4"></div>
      <ul className="space-y-3 flex-grow overflow-y-auto no-scrollbar">
        {members.map((member) => {
          const isInvited = pendingInvites[member.uuid];
          const isMember = groupMemberUuids.includes(member.uuid);

          if (inviteMode && isMember) return null;

          return (
            <li
              key={member.uuid}
              className="flex items-center justify-center lg:justify-between cursor-pointer hover:bg-gray-100 transition-colors duration-300 p-2 rounded"
            >
              {inviteMode ? (
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
                    <span className="hidden lg:block truncate whitespace-nowrap">
                      {member.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleInviteAction(member.uuid)}
                    className="w-10 h-10 bg-transparent rounded flex items-center justify-center transition-all duration-300"
                  >
                    <Icons
                      name={isInvited ? "close" : "userAdd"}
                      className="w-6 h-6 text-gray-400 hover:text-blue-400 duration-300"
                    />
                  </button>
                </div>
              ) : (
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
          );
        })}
      </ul>
      <div className="mt-4 border-t border-gray-300 pt-4">
        <button
          onClick={handleToggleInviteMode}
          className="w-full inline-flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
        >
          {inviteMode ? "취소" : "초대"}
        </button>
      </div>
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
