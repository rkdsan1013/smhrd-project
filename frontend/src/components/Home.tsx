// /frontend/src/components/Home.tsx

import React from "react";

const Home: React.FC = () => {
  return (
    // 최상위 컨테이너는 항상 부모 영역의 높이(h-full)를 상속받습니다.
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* 캘린더 영역: 최소 높이를 25rem으로 설정하여 양쪽에서 일관성 있게 유지하며, flex-1과 lg:h-full로 부모 높이 채움 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[25rem] lg:min-h-[25rem] lg:h-full">
        <div className="flex-1 bg-gray-100 rounded flex items-center justify-center">
          캘린더 컴포넌트 자리
        </div>
      </div>

      {/* 대시보드 영역: 캘린더와 동일하게 최소 25rem, flex-1, lg:h-full */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[25rem] lg:min-h-[25rem] lg:h-full">
        <div className="grid grid-cols-2 gap-4 flex-1 h-full">
          <div className="bg-gray-50 rounded flex items-center justify-center h-full">
            현재 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center h-full">
            다음 일정
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center h-full">
            인기 여행지
          </div>
          <div className="bg-gray-50 rounded flex items-center justify-center h-full">
            인기 그룹
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
