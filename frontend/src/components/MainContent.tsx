import React from "react";

interface MainContentProps {
  selectedGroupUuid: string | null;
}

const MainContent: React.FC<MainContentProps> = ({ selectedGroupUuid }) => {
  return (
    <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">MAIN Test Page</h1>
      {selectedGroupUuid ? (
        <p className="text-lg">선택된 그룹 UUID: {selectedGroupUuid}</p>
      ) : (
        <p className="text-lg">선택된 그룹이 없습니다.</p>
      )}
    </main>
  );
};

export default MainContent;
