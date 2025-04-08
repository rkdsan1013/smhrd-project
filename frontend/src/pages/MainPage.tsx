// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import { useUser } from "../contexts/UserContext";
import { UserProfileProvider } from "../contexts/UserProfileContext";
import { FriendProvider } from "../contexts/FriendContext";

// 메인 화면에서 사용할 view 타입
type MainView = "home" | "groupSearch" | "groupRoom";

// 그룹 정보(예: 그룹명, UUID 등)를 포함하는 상태 인터페이스
interface MainContentState {
  view: MainView;
  groupUuid?: string;
  groupName?: string;
}

// Framer Motion 애니메이션 설정 상수
const MOTION_VARIANTS = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};
const MOTION_TRANSITION = { duration: 0.3 };

const MainContent: React.FC = () => {
  const { userUuid } = useUser();
  const [mainContent, setMainContent] = useState<MainContentState>({ view: "home" });

  // Sidebar 이벤트 핸들러
  const handleHomeSelect = () => setMainContent({ view: "home" });
  const handleGroupSearchSelect = () => setMainContent({ view: "groupSearch" });
  const handleGroupSelect = (groupUuid: string, groupName: string) =>
    setMainContent({ view: "groupRoom", groupUuid, groupName });

  // 현재 선택된 view에 따라 메인 컨텐츠 렌더링
  const renderMainContent = () => {
    switch (mainContent.view) {
      case "home":
        return <Home />;
      case "groupSearch":
        return <GroupSearch />;
      case "groupRoom":
        return mainContent.groupUuid && mainContent.groupName ? (
          <GroupRoom
            groupUuid={mainContent.groupUuid}
            groupName={mainContent.groupName}
            currentUserUuid={userUuid}
          />
        ) : (
          <div>그룹 정보가 없습니다.</div>
        );
      default:
        return <Home />;
    }
  };

  // 그룹 채팅 화면의 경우 추가적인 스타일 처리를 위해
  const isGroupRoomView = mainContent.view === "groupRoom";

  return (
    <div className="h-full p-4">
      <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
        />
        <div className="flex-1 flex flex-col gap-5 min-h-0">
          {/* main 영역: 모바일에서는 h-auto, 데스크톱에서는 md:h-full */}
          <main
            className={`flex-1 bg-white rounded-lg shadow-lg p-6 relative min-h-0 ${
              isGroupRoomView
                ? "flex flex-col overflow-hidden h-full"
                : "overflow-y-auto no-scrollbar h-auto md:h-full"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                className={`flex-1 ${isGroupRoomView ? "h-full" : "h-auto md:h-full"}`}
                variants={MOTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={MOTION_TRANSITION}
              >
                {renderMainContent()}
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const MainPage: React.FC = () => (
  <UserProfileProvider>
    <FriendProvider>
      <MainContent />
    </FriendProvider>
  </UserProfileProvider>
);

export default MainPage;
