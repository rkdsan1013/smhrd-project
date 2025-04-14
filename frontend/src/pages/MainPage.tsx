// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import CalendarView from "../components/CalendarView";

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

  const handleHomeSelect = () => setMainContent({ view: "home" });
  const handleGroupSearchSelect = () => setMainContent({ view: "groupSearch" });
  const handleGroupSelect = (groupUuid: string, groupName: string) =>
    setMainContent({ view: "groupRoom", groupUuid, groupName });
  const handleCalendarSelect = () => setMainContent({ view: "calendar" });

  const renderMainContent = () => {
    switch (mainContent.view) {
      case "home":
        return <Home />;
      case "groupSearch":
        // userUuid를 전달하여 TS 오류 해결
        return <GroupSearch userUuid={userUuid} />;
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
        return <CalendarView />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="h-screen p-4">
      <div className="h-full flex flex-col md:flex-row gap-4 min-h-0 min-w-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
          onCalendarSelect={handleCalendarSelect}
        />
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          <main className="flex-1 bg-white rounded-lg shadow-lg relative overflow-y-auto no-scrollbar min-h-0 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                className="flex flex-col h-full"
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
