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

// 그룹 정보(예: 그룹명, UUID 등)를 포함할 수 있음
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
  // Sidebar에서 그룹 선택 시 그룹 정보 업데이트
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

  // 그룹 채팅 화면의 경우 스크롤을 제거하기 위해 별도 처리
  const isGroupRoomView = mainContent.view === "groupRoom";

  return (
    // 최상위 컨테이너: App.tsx에서 h-screen을 부여받아 h-full으로 사용
    <div className="h-full p-4">
      <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
        />
        <div className="flex-1 flex flex-col gap-5 min-h-0">
          {/* main 태그에 h-auto를 주되, 데스크톱에서는 md:h-full로 전체 높이를 채웁니다 */}
          <main
            className={`flex-1 bg-white rounded-lg shadow-lg p-6 relative min-h-0 ${
              isGroupRoomView
                ? "flex flex-col overflow-hidden h-full"
                : "overflow-y-auto no-scrollbar h-auto md:h-full"
            }`}
          >
            <AnimatePresence mode="wait">
              {/* 여기서 모바일은 h-auto, 데스크톱은 md:h-full을 강제 적용 */}
              <motion.div
                key={`${mainContent.view}-${mainContent.groupUuid || ""}`}
                className={`flex-1 ${isGroupRoomView ? "h-full" : "h-auto md:h-full"}`}
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
