// /frontend/src/pages/MainPage.tsx

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Home from "../components/Home";
import GroupSearch from "../components/GroupSearch";
import GroupRoom from "../components/GroupRoom";
import { UserProfileProvider } from "../contexts/UserProfileContext";

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

  return (
    <UserProfileProvider>
      <div className="h-screen p-4">
        {/* 전체 화면을 h-screen으로 잡고 내부에는 flex 컨테이너로 배치 */}
        <div className="h-full flex flex-col md:flex-row gap-5">
          <Sidebar
            onHomeSelect={handleHomeSelect}
            onGroupSearchSelect={handleGroupSearchSelect}
            onGroupSelect={handleGroupSelect}
          />
          {/* 메인 컨텐츠 영역과 푸터를 포함하는 오른쪽 영역 */}
          {/* min-h-0 을 지정하여 내부에서 overflow-y-auto가 올바르게 동작하도록 함 */}
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            {/* 메인 영역 - flex-1과 overflow-y-auto로 내부 컨텐츠가 부족할 경우 스크롤 발생 */}
            <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto min-h-0">
              {renderMainContent()}
            </main>
            {/* 푸터는 항상 화면 하단에 표시 */}
            <Footer />
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
};

export default MainPage;
