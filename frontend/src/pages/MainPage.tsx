// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import { useUser } from "../contexts/UserContext";
import { UserProfileProvider } from "../contexts/UserProfileContext";
import { FriendProvider } from "../contexts/FriendContext";
import { AnimatePresence, motion } from "framer-motion";

// 메인 내용 전환에 사용할 view 타입 정의
type MainView = "home" | "groupSearch" | "groupRoom";

// 그룹명도 필요하다면 포함할 수 있음
interface MainContentState {
  view: MainView;
  groupUuid?: string;
  groupName?: string;
}

const MainContent: React.FC = () => {
  const { userUuid } = useUser();

  const [mainContent, setMainContent] = useState<MainContentState>({ view: "home" });

  const handleHomeSelect = () => setMainContent({ view: "home" });
  const handleGroupSearchSelect = () => setMainContent({ view: "groupSearch" });
  // Sidebar에서 그룹 선택 시 그룹의 UUID와 그룹 이름을 받아 상태를 업데이트합니다.
  const handleGroupSelect = (groupUuid: string, groupName: string) =>
    setMainContent({ view: "groupRoom", groupUuid, groupName });

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

  // Framer Motion 애니메이션 variants
  const motionVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // 그룹 채팅 화면인 경우, 상위 부모에서 스크롤이 발생하지 않도록 flex layout 적용
  const isGroupRoomView = mainContent.view === "groupRoom";

  return (
    <div className="h-screen p-4">
      <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
        />
        <div className="flex-1 flex flex-col gap-5 min-h-0">
          <main
            className={`flex-1 bg-white rounded-lg shadow-lg p-6 relative min-h-0 ${
              isGroupRoomView ? "flex flex-col overflow-hidden" : "overflow-y-auto no-scrollbar"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                className={`flex-1 ${isGroupRoomView ? "h-full" : "h-auto"}`}
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
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

const MainPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <FriendProvider>
        <MainContent />
      </FriendProvider>
    </UserProfileProvider>
  );
};

export default MainPage;
