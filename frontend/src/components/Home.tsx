// /frontend/src/components/Home.tsx

import React from "react";
import Calendar from "./Calendar";

const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto no-scrollbar min-h-[32rem]">
      {/* 캘린더 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-[32rem] overflow-hidden">
        <div className="flex-1 bg-gray-100 rounded-lg w-full h-full">
          <Calendar mode="read" view="month" />
        </div>
      </div>

      {/* 대시보드 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-[32rem] p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[6rem] text-sm text-center px-2">
            현재 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[6rem] text-sm text-center px-2">
            다음 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[6rem] text-sm text-center px-2">
            인기 여행지
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[6rem] text-sm text-center px-2">
            인기 그룹
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
