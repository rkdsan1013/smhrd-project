// /frontend/src/components/DirectMessage.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  sendMessageSocket,
  joinChatRoom,
  fetchMessagesByRoom,
  ChatMessage,
} from "../services/chatService";
import { useSocket } from "../contexts/SocketContext";

interface DirectMessageProps {
  roomUuid: string;
  currentUserUuid: string;
  onBack: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ roomUuid, currentUserUuid, onBack }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket(); // ✅ 소켓 컨텍스트에서 가져옴

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await fetchMessagesByRoom(roomUuid);
        setMessages(initialMessages);
      } catch (err) {
        console.error("이전 메시지 불러오기 실패:", err);
      }
    };

    loadMessages();

    if (socket) {
      joinChatRoom(socket, roomUuid);

      const handleReceive = (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      };

      socket.on("receiveMessage", handleReceive);

      return () => {
        socket.off("receiveMessage", handleReceive);
      };
    }
  }, [roomUuid, socket]);

  // ✅ 메시지 변경 시 가장 하단으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;
    sendMessageSocket(socket, roomUuid, input); // ✅ 소켓 전달
    setInput("");
  };

  // ✅ 엔터 키로 메시지 전송
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80 h-[500px] p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold">채팅방</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition">
          ✕
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto text-sm text-gray-700 space-y-2 mb-2">
        {messages.map((msg, idx) =>
          msg.sender_uuid === currentUserUuid ? (
            <div key={msg.uuid ?? idx} className="flex justify-end pr-1">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-[70%] break-words">
                {msg.message}
              </div>
            </div>
          ) : (
            <div key={msg.uuid ?? idx} className="flex items-start space-x-2">
              {msg.sender_picture ? (
                <img
                  src={msg.sender_picture}
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full object-cover mt-1"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mt-1">
                  <svg
                    className="w-4 h-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.121 17.804A10 10 0 1119 12.001M15 11h.01M9 11h.01M7 15s1.5 2 5 2 5-2 5-2"
                    />
                  </svg>
                </div>
              )}
              <div className="bg-gray-100 px-3 py-2 rounded-lg max-w-[70%] break-words">
                <p className="text-xs text-gray-500 mb-1">{msg.sender_name}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ),
        )}
        <div ref={scrollRef} />
      </div>

      {/* 입력창 */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSendMessage}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default DirectMessage;
