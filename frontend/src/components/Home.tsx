// /frontend/src/components/Home.tsx

import React from "react";
import Calendar from "./Calendar";
import PopularDestinations from "./PopularTravelDestinations";

const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto no-scrollbar min-h-[32rem]">
      {/* 캘린더 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-[32rem] overflow-hidden">
        <div className="flex-1 bg-gray-100 rounded-lg w-full h-full">
          <Calendar mode="read" view="month" />
        </div>
      </div>

      {/* 대시보드 영역: 캘린더와 동일하게 최소 25rem, flex-1, lg:h-full */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-row min-h-[25rem] lg:min-h-[25rem] lg:h-full gap-4">
        {/* 왼쪽: 현재 일정 / 다음 일정 */}
        <div className="flex flex-col flex-1 gap-4">
          <div className="bg-gray-50 rounded flex items-center justify-center flex-1">
            현재 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center flex-1">
            다음 일정
          </div>
        </div>

        {/* 오른쪽: 여행지 + 지도 컴포넌트 */}
        <div className="bg-gray-50 rounded flex items-center justify-center flex-1">
          <PopularDestinations />
        </div>
      </div>
    </div>
  );
};

export default Home;
