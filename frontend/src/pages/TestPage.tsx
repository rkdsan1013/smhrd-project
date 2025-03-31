import React from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const TestPage: React.FC = () => {
  return (
    // 화면 전체 높이 사용, 내부 여백 및 회색 배경
    <div className="h-screen bg-gray-100 p-5">
      {/* 데스크탑(md 이상): 좌우 배치, 모바일: 상하 배치 */}
      <div className="h-full flex flex-col md:flex-row gap-5">
        {/* Sidebar는 모바일에서 전체 폭을 사용하고 데스크탑에서는 고정 폭 */}
        <Sidebar />

        {/* 오른쪽: 메인 영역과 Footer를 포함하는 콘텐츠 컨테이너 */}
        <div className="flex-1 flex flex-col gap-5">
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Test Page</h1>
            <p>여기는 테스트 페이지의 메인 컨텐츠 영역입니다. 원하는 내용을 자유롭게 추가하세요.</p>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default TestPage;
