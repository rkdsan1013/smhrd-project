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
  // App.tsx 등 상위에서 UserProvider를 사용하여 실제 사용자 UUID가 설정되어 있다고 가정합니다.
  // 따라서 useUser() 훅을 통해 상위 Provider의 값을 그대로 불러옵니다.
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
          // GroupRoom 컴포넌트에 실제 사용자 UUID가 전달되어 joinGroup 요청 시 올바른 값이 사용됩니다.
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

  return (
    <div className="h-screen p-4">
      <div className="h-full flex flex-col md:flex-row gap-5 min-h-0">
        <Sidebar
          onHomeSelect={handleHomeSelect}
          onGroupSearchSelect={handleGroupSearchSelect}
          onGroupSelect={handleGroupSelect}
        />
        <div className="flex-1 flex flex-col gap-5 min-h-0">
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto no-scrollbar min-h-0 relative">
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
