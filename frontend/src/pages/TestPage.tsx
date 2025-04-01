// /frontend/src/pages/TestPage.tsx
import React from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const TestPage: React.FC = () => {
  return (
    <div className="h-screen p-4">
      <div className="h-full flex flex-col md:flex-row gap-5">
        {/* Sidebar */}
        <Sidebar />

        {/* 오른쪽 메인 영역: 메인 컨텐츠와 Footer */}
        <div className="flex-1 flex flex-col gap-5">
          <main className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Test Page</h1>
            <p>Test Page</p>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default TestPage;
