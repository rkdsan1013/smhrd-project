// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import { UserProfileProvider } from "../contexts/UserProfileContext";
import { AnimatePresence, motion } from "framer-motion";

type MainView = "home" | "groupSearch" | "groupRoom";

interface MainContentState {
  view: MainView;
  groupUuid?: string;
}

const MainPage: React.FC = () => {
  const [mainContent, setMainContent] = useState<MainContentState>({ view: "home" });

  const handleHomeSelect = () => {
    setMainContent({ view: "home" });
  };

  const handleGroupSearchSelect = () => {
    setMainContent({ view: "groupSearch" });
  };

  const handleGroupSelect = (groupUuid: string) => {
    setMainContent({ view: "groupRoom", groupUuid });
  };

  const renderMainContent = () => {
    switch (mainContent.view) {
      case "home":
        return <Home />;
      case "groupSearch":
        return <GroupSearch />;
      case "groupRoom":
        return mainContent.groupUuid ? (
          <GroupRoom groupUuid={mainContent.groupUuid} />
        ) : (
          <div>그룹 정보가 없습니다.</div>
        );
      default:
        return <Home />;
    }
  };

  // 애니메이션 효과를 위한 Framer Motion variants
  const motionVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <UserProfileProvider>
      <div className="h-screen p-4">
        <div className="h-full flex flex-col md:flex-row gap-5">
          <Sidebar
            onHomeSelect={handleHomeSelect}
            onGroupSearchSelect={handleGroupSearchSelect}
            onGroupSelect={handleGroupSelect}
          />
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto min-h-0 relative">
              {/* 애니메이션 영역을 overflow-hidden으로 감싸 스크롤 숨김 */}
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    {renderMainContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
};

export default MainPage;
