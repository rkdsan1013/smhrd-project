// /frontend/src/components/MainContent.tsx
import React from "react";
import SocketTestComponent from "./SocketTestComponent";

const MainContent: React.FC = () => {
  return (
    <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      {/* 테스트용 소켓 컴포넌트 추가 */}
      <SocketTestComponent />
    </main>
  );
};

export default MainContent;
