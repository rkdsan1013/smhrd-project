// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import CalendarBase from "../components/CalendarBase";

import { useUser } from "../contexts/UserContext";

type MainView = "home" | "groupSearch" | "groupRoom" | "calendar";

interface MainContentState {
  view: MainView;
  groupUuid?: string;
  groupName?: string;
}

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
  const handleCalendarSelect = () => setMainContent({ view: "calendar" });

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
      case "calendar":
        return <CalendarBase />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="h-full p-4">
      <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
          onCalendarSelect={handleCalendarSelect}
        />
        <div className="flex-1 flex flex-col gap-5 min-h-0">
          {/* “h-auto md:h-full”에서 h-auto를 h-full로 변경하여 모바일에서도 전체 높이를 채우도록 함 */}
          <main className="flex-1 bg-white rounded-lg shadow-lg relative min-h-0 h-full overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                className="flex-1 h-full"
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

const MainPage: React.FC = () => <MainContent />;

export default MainPage;
