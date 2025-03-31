// /frontend/src/pages/TestPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const TestPage: React.FC = () => {
  // 창 넓이를 상태로 관리 (초기값은 window.innerWidth)
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  // 창 크기 변경 시 상태 업데이트
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 모바일 상태와 데스크탑 상태를 구분하는 key
  const layoutKey = windowWidth < 768 ? "mobile" : "desktop";

  return (
    <div className="h-screen p-4">
      <motion.div
        // key 값을 설정하면 창 크기가 바뀔 때 해당 요소가 remount되어 layout 애니메이션이 발생함
        key={layoutKey}
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
        // 모바일에서는 flex-col, 데스크탑에서는 flex-row 설정 (또는 반대로 원하는 대로 배치)
        className="h-full flex flex-col md:flex-row gap-5"
      >
        {/* Sidebar는 기존 설정대로 */}
        <Sidebar />

        {/* 오른쪽 메인 영역: 메인 컨텐츠와 Footer 포함 */}
        <div className="flex-1 flex flex-col gap-5">
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Test Page</h1>
            <p>여기는 테스트 페이지의 메인 컨텐츠 영역입니다. 원하는 내용을 자유롭게 추가하세요.</p>
          </main>
          <Footer />
        </div>
      </motion.div>
    </div>
  );
};

export default TestPage;
