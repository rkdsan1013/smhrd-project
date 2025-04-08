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
  // 기본 탭은 채팅으로 설정합니다.
  const [selectedTab, setSelectedTab] = useState<TabType>("chat");
  // 백엔드에서 받아온 채팅방 UUID
  const [chatRoomUuid, setChatRoomUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchChatRoomUuid = async () => {
      try {
        const data = await getGroupChatRoomUuid(groupUuid);
        // 응답 예시: { chat_room_uuid: "..." }
        setChatRoomUuid(data.chat_room_uuid);
      } catch (error) {
        console.error("채팅방 정보를 가져오는데 실패했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRoomUuid();
  }, [groupUuid]);

  return (
    <div className="h-full flex flex-col p-4">
      <main className="flex flex-1 overflow-hidden">
        {/* 좌측 메뉴 영역 */}
        <aside className="w-64 border-r border-gray-300 p-4 flex flex-col">
          {/* 상단 그룹: 공지사항, 일정 */}
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => setSelectedTab("announcement")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-all duration-300"
              >
                <Icons name="bell" className="w-5 h-5 mr-2" />
                공지사항
              </button>
            </li>
            <li>
              <button
                onClick={() => setSelectedTab("calendar")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-all duration-300"
              >
                <Icons name="calendar" className="w-5 h-5 mr-2" />
                일정
              </button>
            </li>
          </ul>

          {/* 상단과 중간 구분선 */}
          <div className="my-4 border-t border-gray-300" />

          {/* 중간 그룹: 채팅 */}
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => setSelectedTab("chat")}
                className="w-full text-left flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-all duration-300"
              >
                <Icons name="chat" className="w-5 h-5 mr-2" />
                채팅
              </button>
            </li>
          </ul>

          {/* 남은 공간 채우기 */}
          <div className="flex-grow" />

          {/* 하단 구분선 */}
          <div className="mb-2 border-t border-gray-300" />

          {/* 하단 그룹: 설정 */}
          <button
            onClick={() => setSelectedTab("settings")}
            className="w-full text-left flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-all duration-300"
          >
            <Icons name="cog" className="w-5 h-5 mr-2" />
            설정
          </button>
        </aside>

        {/* 중앙 콘텐츠 영역 */}
        {/* no-scrollbar 클래스를 추가하여 스크롤바를 숨깁니다 */}
        <section className="flex-1 p-4 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {selectedTab === "announcement" && (
              <motion.div
                key={`announcement-${groupUuid}`}
                className="h-auto lg:h-full"
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
                className="h-auto lg:h-full"
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
                className="h-auto lg:h-full"
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
                className="h-auto lg:h-full"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <GroupSettings />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 우측 멤버 리스트 영역 */}
        <aside className="w-80 border-l border-gray-300 p-4 flex flex-col">
          <GroupMemberList groupUuid={groupUuid} />
        </aside>
      </main>
    </div>
  );
};

export default GroupRoom;
