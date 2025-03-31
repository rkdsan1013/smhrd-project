import React from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const TestPage: React.FC = () => {
  return (
    <div className="h-screen bg-gray-100 p-6">
      <div className="h-full flex flex-col md:flex-row gap-6">
        {/* 왼쪽: 고정 너비의 사이드바 */}
        <Sidebar />

        {/* 오른쪽: 메인 영역과 footer를 포함하는 콘텐츠 컨테이너 */}
        <div className="flex-1 flex flex-col gap-6">
          {/* 메인 콘텐츠 카드 */}
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Test Page</h1>
            <p>여기는 테스트 페이지의 메인 컨텐츠 영역입니다. 원하는 내용을 자유롭게 추가하세요.</p>
          </main>

          {/* footer는 메인 영역 외부에 배치 */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default TestPage;
