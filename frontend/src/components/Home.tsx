// /frontend/src/components/Home.tsx

import React from "react";

const Home: React.FC = () => {
  return (
    // Home 영역은 전체 높이를 사용하며, 기본적으로 세로(모바일)로 쌓이고, lg 이상에서는 좌우로 배치됩니다.
    // 스크롤바는 .no-scrollbar 클래스로 숨김 처리되어 있습니다.
    <div className="h-full flex flex-col lg:flex-row gap-4 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* 캘린더 영역: 모바일에서는 전체 폭, lg 이상에서는 좌측에 배치 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[25rem] lg:min-h-[18.75rem]">
        <div className="flex-1 bg-gray-100 rounded flex items-center justify-center">
          캘린더 컴포넌트 자리
        </div>
      </div>

      {/* 대시보드 영역: 모바일에서는 전체 폭, lg 이상에서는 우측에 배치 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[18.75rem]">
        {/* grid-cols-2를 고정하여 모바일에서도 2열 그리드 형태를 유지 */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* 모바일: "현재 일정", "다음 일정" 먼저 / 데스크탑: 재정렬 */}
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[9.375rem] order-1 lg:order-3">
            현재 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[9.375rem] order-2 lg:order-4">
            다음 일정
          </div>
          {/* 모바일: 이후 "인기 여행지", "인기 그룹" / 데스크탑: 상단에 배치 */}
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[9.375rem] order-3 lg:order-1">
            인기 여행지
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center min-h-[9.375rem] order-4 lg:order-2">
            인기 그룹
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
