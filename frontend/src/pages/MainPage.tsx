// /frontend/src/pages/MainPage.tsx
import React from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { UserProfileProvider } from "../contexts/UserProfileContext";
import SocketTestComponent from "../components/SocketTestComponent"; // 테스트 컴포넌트

const MainPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <div className="h-screen p-4">
        <div className="h-full flex flex-col md:flex-row gap-5">
          {/* Sidebar */}
          <Sidebar />

          {/* 오른쪽 메인 영역: 메인 컨텐츠와 Footer */}
          <div className="flex-1 flex flex-col gap-5">
            <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
              <h1 className="text-2xl font-bold mb-4">Test Page</h1>
              {/* 테스트용 소켓 컴포넌트 추가 */}
              <SocketTestComponent />
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
};

export default MainPage;
