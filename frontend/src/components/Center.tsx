import React, { useState } from "react";
import GroupForm from "./GroupForm";

const Center: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Plan");
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [chatList, setChatList] = useState<string[]>([]);

  const handleAlertClick = () => {
    setActiveTab("Alert");
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleNewChat = () => {
    const newChatName = `Chat ${chatList.length + 1}`;
    setChatList([...chatList, newChatName]);
    setActiveTab(newChatName);
  };

  const handleDeleteChat = (chatName: string) => {
    const updatedChatList = chatList.filter((chat) => chat !== chatName);
    setChatList(updatedChatList);
    setActiveTab("Plan");
  };

  const handleCloseGroupForm = () => {
    setShowGroupForm(false);
  };

  return (
    <div className="flex h-[92vh] mt-[5vh] mb-[5vh] rounded-lg overflow-hidden">
      {/* Left Sidebar (1/10) */}
      <div className="w-1/10 bg-gray-100 p-2 rounded-l-lg">
        <p className="text-gray-600">Left</p>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col border border-gray-400 rounded-lg">
        {/* Top Bar */}
        <div className="bg-gray-50 p-2 border-b-2 border-gray-400 rounded-t-lg">
          <p className="text-center text-base text-gray-800">{activeTab}</p>
          {showAlert && (
            <div className="mt-2 text-center text-sm text-red-600">
              📢 Alert 활성화됨!
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-60 bg-gray-50 p-2 border-r-2 border-gray-200 space-y-2 rounded-b-lg">
            <button
              className="w-full py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200"
              onClick={handleAlertClick}
            >
              🔔 Alert
            </button>
            <button
              className="w-full py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200"
              onClick={handleNewChat}
            >
              ➕ 새 채팅
            </button>
            <button
              className="w-full py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200"
              onClick={() => setShowGroupForm(true)}
            >
              ➕ 그룹 생성
            </button>

            {/* Chat List */}
            {chatList.length > 0 && (
              <div className="mt-2 space-y-1">
                {chatList.map((chat, index) => (
                  <div key={index} className="flex items-center">
                    <button
                      className="flex-1 text-left text-sm text-gray-700 hover:text-blue-600"
                      onClick={() => setActiveTab(chat)}
                    >
                      💬 {chat}
                    </button>
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteChat(chat)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              className="w-full py-2 text-black rounded-lg text-sm hover:bg-blue-400 duration-200"
              onClick={() => setActiveTab("Vote")}
            >
              🗳️ Vote
            </button>
          </div>

          {/* Center Content */}
          <div className="flex-1 p-4 rounded-lg">
            <p className="text-gray-700">{activeTab} 화면</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar (GroupForm) */}
      <div className="w-1/4 bg-gray-100 p-2 relative rounded-r-lg">
        {showGroupForm && (
          <>
            <GroupForm />
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={handleCloseGroupForm}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Center;