import React from "react";

const Home: React.FC = () => {
  return (
    // 최상위 컨테이너는 부모(MainPage)의 flex-1 영역에서 명시적 높이(h-full)와 최소 높이(min-h-[25rem])를 상속받습니다.
    // 데스크톱 환경에서는 md:h-full을 통해 부모의 전체 높이를 채우도록 합니다.
    <div className="flex-1 min-h-[25rem] flex flex-col md:flex-row gap-4 md:h-full">
      {/* 캘린더 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[25rem] md:min-h-0 md:h-full">
        <div className="flex-1 bg-gray-100 rounded flex items-center justify-center">
          캘린더 컴포넌트 자리
        </div>
      </div>

      {/* 대시보드 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-[25rem] md:min-h-0 md:h-full">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-gray-50 rounded flex items-center justify-center">현재 일정</div>
          <div className="bg-gray-50 rounded flex items-center justify-center">다음 일정</div>
          <div className="bg-gray-50 rounded flex items-center justify-center">인기 여행지</div>
          <div className="bg-gray-50 rounded flex items-center justify-center">인기 그룹</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
