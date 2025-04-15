// /frontend/src/components/GroupRoom.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GroupChat from "./GroupChat";
import GroupAnnouncement from "./GroupAnnouncement";
import GroupSettings from "./GroupSettings";
import GroupMemberList from "./GroupMemberList";
import VoteList from "./VoteList";
import Icons from "./Icons";
import { getGroupChatRoomUuid, getGroupDetails } from "../services/groupService";
import { getScheduleChatRoomUuid } from "../services/scheduleService";
import { useSocket } from "../contexts/SocketContext";

interface GroupRoomProps {
  groupUuid: string;
  currentUserUuid: string;
}

type TabType = "announcement" | "chat" | "settings" | "vote";

const motionVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const GroupRoom: React.FC<GroupRoomProps> = ({ groupUuid, currentUserUuid }) => {
  const [selectedTab, setSelectedTab] = useState<TabType>("chat");
  const [chatRoomUuid, setChatRoomUuid] = useState<string | null>(null);
  const [scheduleChatRoomUuid, setScheduleChatRoomUuid] = useState<string | null>(null);
  const [scheduleChatRoomTitle, setScheduleChatRoomTitle] = useState<string | null>(null);
  const [scheduleUuid, setScheduleUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chatRoomError, setChatRoomError] = useState<string | null>(null);
  const [scheduleChatRoomError, setScheduleChatRoomError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setLoading(true);
      try {
        const data = await getGroupDetails(groupUuid);
        setGroupDetails(data);
        console.log(`[GroupRoom] 그룹 상세 조회 성공: ${groupUuid}`);
      } catch (error: any) {
        console.error(`[GroupRoom] 그룹 상세 조회 실패: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupUuid]);

  useEffect(() => {
    const fetchChatRoomUuid = async () => {
      setLoading(true);
      setChatRoomError(null);
      try {
        const data = await getGroupChatRoomUuid(groupUuid);
        setChatRoomUuid(data.chat_room_uuid);
        console.log(`[GroupRoom] 그룹 채팅방 UUID 조회 성공: ${data.chat_room_uuid}`);
      } catch (error: any) {
        setChatRoomError("그룹 채팅방 정보를 가져오지 못했습니다.");
        console.error(`[GroupRoom] 그룹 채팅방 조회 실패 (group ${groupUuid}): ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRoomUuid();
  }, [groupUuid]);

  useEffect(() => {
    const fetchScheduleChatRoomUuid = async () => {
      if (!scheduleUuid) {
        setScheduleChatRoomUuid(null);
        setScheduleChatRoomTitle(null);
        return;
      }

      console.log(`[GroupRoom] 일정 채팅방 조회 시작 (schedule ${scheduleUuid})`);
      setLoading(true);
      setScheduleChatRoomError(null);
      try {
        const data = await getScheduleChatRoomUuid(scheduleUuid);
        setScheduleChatRoomUuid(data.chat_room_uuid);
        setScheduleChatRoomTitle(data.title);
        console.log(
          `[GroupRoom] 일정 채팅방 조회 성공: ${data.chat_room_uuid}, title: ${data.title}`,
        );
      } catch (error: any) {
        const errMsg =
          error.statusCode === 403
            ? "이 일정 채팅방에 접근할 권한이 없습니다."
            : "일정 채팅방 정보를 가져오지 못했습니다.";
        setScheduleChatRoomError(errMsg);
        console.error(
          `[GroupRoom] 일정 채팅방 조회 실패 (schedule ${scheduleUuid}): ${error.message}`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleChatRoomUuid();
  }, [scheduleUuid]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinRoom", groupUuid);

    const handleScheduleCreated = ({
      scheduleUuid: newScheduleUuid,
      groupUuid: eventGroupUuid,
      title,
    }: {
      scheduleUuid: string;
      groupUuid: string;
      title: string;
    }) => {
      if (eventGroupUuid === groupUuid) {
        console.log(`[GroupRoom] 새 일정 생성: ${newScheduleUuid}, title: ${title}`);
        if (selectedTab !== "vote") {
          alert(`새 일정 "${title}"이 생성되었습니다.`);
        }
      }
    };

    const handleTravelVoteCreated = ({
      voteUuid,
      groupUuid: eventGroupUuid,
    }: {
      voteUuid: string;
      groupUuid: string;
    }) => {
      if (eventGroupUuid === groupUuid) {
        console.log(`[GroupRoom] 새 투표 생성: ${voteUuid}`);
        if (selectedTab !== "vote") {
          alert("새 투표가 생성되었습니다.");
        }
      }
    };

    const handleGroupMemberLeft = ({
      groupUuid: eventGroupUuid,
      userUuid,
    }: {
      groupUuid: string;
      userUuid: string;
    }) => {
      if (eventGroupUuid === groupUuid && userUuid === currentUserUuid) {
        console.log(`[GroupRoom] 사용자 ${userUuid}가 그룹 ${groupUuid}에서 탈퇴함`);
        window.location.href = "/groups";
      }
    };

    const handleAnnouncementCreated = ({
      groupUuid: eventGroupUuid,
      title,
    }: {
      groupUuid: string;
      announcementUuid: string;
      title: string;
    }) => {
      if (eventGroupUuid === groupUuid && selectedTab !== "announcement") {
        alert(`새 공지사항 "${title}"이 등록되었습니다.`);
      }
    };

    socket.on("scheduleCreated", handleScheduleCreated);
    socket.on("travelVoteCreated", handleTravelVoteCreated);
    socket.on("groupMemberLeft", handleGroupMemberLeft);
    socket.on("announcementCreated", handleAnnouncementCreated);

    return () => {
      socket.off("scheduleCreated", handleScheduleCreated);
      socket.off("travelVoteCreated", handleTravelVoteCreated);
      socket.off("groupMemberLeft", handleGroupMemberLeft);
      socket.off("announcementCreated", handleAnnouncementCreated);
    };
  }, [socket, groupUuid, selectedTab, currentUserUuid]);

  const renderChatTab = () => {
    if (loading) {
      return <div className="text-center text-gray-500">채팅방을 불러오는 중...</div>;
    }
    if (scheduleChatRoomError) {
      return <div className="text-center text-red-500">{scheduleChatRoomError}</div>;
    }
    if (scheduleChatRoomUuid) {
      console.log("[GroupRoom] 렌더링: 일정 채팅방 열림");
      return (
        <GroupChat
          roomUuid={scheduleChatRoomUuid}
          currentUserUuid={currentUserUuid}
          roomName={scheduleChatRoomTitle ?? groupDetails?.name ?? "그룹 채팅"}
        />
      );
    }
    if (chatRoomError) {
      return <div className="text-center text-red-500">{chatRoomError}</div>;
    }
    if (chatRoomUuid) {
      console.log("[GroupRoom] 렌더링: 그룹 채팅방 열림");
      return (
        <GroupChat
          roomUuid={chatRoomUuid}
          currentUserUuid={currentUserUuid}
          roomName={groupDetails?.name ?? "그룹 채팅"}
        />
      );
    }
    console.log("[GroupRoom] 렌더링: 채팅방 없음");
    return <div className="text-center text-gray-500">채팅방 정보를 가져오지 못했습니다.</div>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* 모바일 상단 네비게이션 */}
      <div className="block md:hidden mb-4 border-b border-gray-300 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setSelectedTab("announcement")}
            className="flex flex-col items-center p-2 rounded hover:text-blue-600 transition-all duration-200 active:scale-95"
          >
            <Icons name="bell" className="w-6 h-6" />
          </button>
          <button
            onClick={() => setSelectedTab("vote")}
            className="flex flex-col items-center p-2 rounded hover:text-blue-600 transition-all duration-200 active:scale-95"
          >
            <Icons name="calendar" className="w-6 h-6" />
            <span className="hidden lg:inline ml-2">일정</span>
          </button>
          <button
            onClick={() => setSelectedTab("chat")}
            className="flex flex-col items-center p-2 rounded hover:text-blue-600 transition-all duration-200 active:scale-95"
          >
            <Icons name="chat" className="w-6 h-6" />
          </button>
          <button
            onClick={() => setSelectedTab("settings")}
            className="flex flex-col items-center p-2 rounded hover:text-blue-600 transition-all duration-200 active:scale-95"
          >
            <Icons name="cog" className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* 데스크탑 좌측 사이드바 */}
        <aside className="hidden md:flex flex-col md:w-24 lg:w-52 flex-shrink-0 border-r border-gray-300 p-4">
          <div className="space-y-4">
            <button
              onClick={() => setSelectedTab("announcement")}
              className="w-full flex items-center justify-center lg:justify-start lg:text-left p-2 rounded hover:bg-gray-100 transition-all duration-200 active:scale-95"
            >
              <Icons name="bell" className="w-6 h-6" />
              <span className="hidden lg:inline ml-2">공지</span>
            </button>
            <button
              onClick={() => setSelectedTab("vote")}
              className="w-full flex items-center justify-center lg:justify-start lg:text-left p-2 rounded hover:bg-gray-100 transition-all duration-200 active:scale-95"
            >
              <Icons name="calendar" className="w-6 h-6" />
              <span className="hidden lg:inline ml-2">일정</span>
            </button>
            <button
              onClick={() => setSelectedTab("chat")}
              className="w-full flex items-center justify-center lg:justify-start lg:text-left p-2 rounded hover:bg-gray-100 transition-all duration-200 active:scale-95"
            >
              <Icons name="chat" className="w-6 h-6" />
              <span className="hidden lg:inline ml-2">채팅</span>
            </button>
          </div>
          <div className="my-2 border-t border-gray-300" />
          <div className="space-y-4"></div>
          <div className="flex-grow" />
          <div className="my-2 border-t border-gray-300" />
          <button
            onClick={() => setSelectedTab("settings")}
            className="w-full flex items-center justify-center lg:justify-start lg:text-left p-2 rounded hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            <Icons name="cog" className="w-6 h-6" />
            <span className="hidden lg:inline ml-2">설정</span>
          </button>
        </aside>

        <section className="flex-1 min-w-0 overflow-hidden p-4">
          <AnimatePresence mode="wait">
            {selectedTab === "announcement" && groupDetails && (
              <motion.div
                key={`announcement-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <GroupAnnouncement
                  groupUuid={groupUuid}
                  currentUserUuid={currentUserUuid}
                  groupLeaderUuid={groupDetails.group_leader_uuid}
                />
              </motion.div>
            )}
            {selectedTab === "chat" && (
              <motion.div
                key={`chat-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {renderChatTab()}
              </motion.div>
            )}
            {selectedTab === "settings" && groupDetails && (
              <motion.div
                key={`settings-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <GroupSettings group={groupDetails} currentUserUuid={currentUserUuid} />
              </motion.div>
            )}
            {selectedTab === "vote" && (
              <motion.div
                key={`vote-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <VoteList
                  groupUuid={groupUuid}
                  currentUserUuid={currentUserUuid}
                  onVoteSelected={(scheduleUuid: string) => {
                    setScheduleUuid(scheduleUuid);
                    setSelectedTab("chat");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="hidden md:flex flex-col md:w-40 lg:w-64 flex-shrink-0 border-l border-gray-300 p-4">
          <GroupMemberList groupUuid={groupUuid} />
        </aside>
      </div>
    </div>
  );
};

export default GroupRoom;
