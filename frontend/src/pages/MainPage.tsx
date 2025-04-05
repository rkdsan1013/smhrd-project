// /frontend/src/pages/MainPage.tsx

import React from "react";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import Footer from "../components/Footer";
import { UserProfileProvider } from "../contexts/UserProfileContext";

const MainPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <div className="h-screen p-4">
        <div className="h-full flex flex-col md:flex-row gap-5">
          <Sidebar />
          <div className="flex-1 flex flex-col gap-5">
            <MainContent />
            <Footer />
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
};

export default MainPage;
