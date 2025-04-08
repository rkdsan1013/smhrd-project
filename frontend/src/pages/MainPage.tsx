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

  const handleHomeSelect = () => setMainContent({ view: "home" });
  const handleGroupSearchSelect = () => setMainContent({ view: "groupSearch" });
  const handleGroupSelect = (groupUuid: string) => setMainContent({ view: "groupRoom", groupUuid });

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

  // Framer Motion 애니메이션 variants
  const motionVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <UserProfileProvider>
      {/* 전체 화면 높이 */}
      <div className="h-screen p-4">
        {/* 최상위 Flex 컨테이너는 min-h-0 적용 */}
        <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
          <Sidebar
            onHomeSelect={handleHomeSelect}
            onGroupSearchSelect={handleGroupSearchSelect}
            onGroupSelect={handleGroupSelect}
          />
          {/* 메인 컨텐츠+푸터 영역 */}
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            {/* <main> 영역은 flex-1, min-h-0, overflow-y-auto로 스크롤 처리 */}
            <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto no-scrollbar min-h-0 relative">
              {/* 모바일: h-auto / 데스크톱: lg:h-full */}
              <div className="h-auto lg:h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                    className="h-auto lg:h-full"
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
