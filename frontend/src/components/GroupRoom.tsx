// /frontend/src/components/GroupRoom.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GroupChat from "./GroupChat";
import GroupAnnouncement from "./GroupAnnouncement";
import GroupCalendar from "./GroupCalendar";
import GroupSettings from "./GroupSettings";
import GroupMemberList from "./GroupMemberList";
import Icons from "./Icons";
import { getGroupChatRoomUuid } from "../services/groupService";

interface GroupRoomProps {
  groupUuid: string;
  currentUserUuid: string;
  groupName: string;
}

type TabType = "announcement" | "calendar" | "chat" | "settings";

const motionVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const GroupRoom: React.FC<GroupRoomProps> = ({ groupUuid, currentUserUuid, groupName }) => {
  const [selectedTab, setSelectedTab] = useState<TabType>("chat");
  const [chatRoomUuid, setChatRoomUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchChatRoomUuid = async () => {
      try {
        const data = await getGroupChatRoomUuid(groupUuid);
        setChatRoomUuid(data.chat_room_uuid);
      } catch (error) {
        console.error("채팅방 정보를 가져오지 못했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRoomUuid();
  }, [groupUuid]);

  return (
    <div className="h-full flex flex-col p-4">
      {/* 모바일 상단 네비게이션: md 미만에서만 표시 */}
      <div className="block md:hidden mb-4 border-b border-gray-300 pb-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setSelectedTab("announcement")}
            className="flex flex-col items-center hover:text-blue-600"
          >
            <Icons name="bell" className="w-6 h-6" />
            <span className="text-xs">공지사항</span>
          </button>
          <button
            onClick={() => setSelectedTab("calendar")}
            className="flex flex-col items-center hover:text-blue-600"
          >
            <Icons name="calendar" className="w-6 h-6" />
            <span className="text-xs">일정</span>
          </button>
          <button
            onClick={() => setSelectedTab("chat")}
            className="flex flex-col items-center hover:text-blue-600"
          >
            <Icons name="chat" className="w-6 h-6" />
            <span className="text-xs">채팅</span>
          </button>
          <button
            onClick={() => setSelectedTab("settings")}
            className="flex flex-col items-center hover:text-blue-600"
          >
            <Icons name="cog" className="w-6 h-6" />
            <span className="text-xs">설정</span>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역: 모바일과 데스크탑 모두 flex-1로 남은 공간 채움 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 데스크탑 좌측 메뉴 (md 이상) */}
        <aside className="hidden md:flex md:flex-col md:w-64 border-r border-gray-300 p-4">
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => setSelectedTab("announcement")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-4 py-3 rounded transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Icons name="bell" className="w-6 h-6 mr-2" />
                공지사항
              </button>
            </li>
            <li>
              <button
                onClick={() => setSelectedTab("calendar")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-4 py-3 rounded transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Icons name="calendar" className="w-6 h-6 mr-2" />
                일정
              </button>
            </li>
            <li>
              <button
                onClick={() => setSelectedTab("chat")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-4 py-3 rounded transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Icons name="chat" className="w-6 h-6 mr-2" />
                채팅
              </button>
            </li>
          </ul>
          <div className="flex-grow" />
          <div className="mb-2 border-t border-gray-300" />
          <button
            onClick={() => setSelectedTab("settings")}
            className="w-full text-left flex items-center hover:bg-gray-100 px-4 py-3 rounded transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Icons name="cog" className="w-6 h-6 mr-2" />
            설정
          </button>
        </aside>

        {/* 중앙 콘텐츠 영역 */}
        <section className="flex-1 overflow-hidden p-4">
          <AnimatePresence mode="wait">
            {selectedTab === "announcement" && (
              <motion.div
                key={`announcement-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <GroupAnnouncement />
              </motion.div>
            )}
            {selectedTab === "calendar" && (
              <motion.div
                key={`calendar-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <GroupCalendar />
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
                transition={{ duration: 0.3 }}
              >
                {loading && <div>채팅방을 불러오는 중...</div>}
                {!loading && chatRoomUuid ? (
                  <GroupChat
                    roomUuid={chatRoomUuid}
                    currentUserUuid={currentUserUuid}
                    roomName={groupName}
                  />
                ) : (
                  !loading && <div>채팅방 정보를 가져오지 못했습니다.</div>
                )}
              </motion.div>
            )}
            {selectedTab === "settings" && (
              <motion.div
                key={`settings-${groupUuid}`}
                className="h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <GroupSettings
                  group={{
                    uuid: groupUuid,
                    name: groupName,
                    description: "",
                    group_icon: "",
                    group_picture: "",
                    visibility: "public",
                    group_leader_uuid: "",
                    created_at: "",
                    updated_at: "",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 데스크탑 우측 멤버 리스트 (md 이상) */}
        <aside className="hidden md:flex md:w-80 border-l border-gray-300 p-4 flex-col">
          <GroupMemberList groupUuid={groupUuid} />
        </aside>
      </div>
    </div>
  );
};

export default GroupRoom;
