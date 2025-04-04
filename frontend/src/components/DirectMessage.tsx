import React, { useEffect, useState } from "react";
import socket from "../services/socket";
import {
  sendMessageSocket,
  joinChatRoom,
  fetchMessagesByRoom,
  ChatMessage,
} from "../services/chatService";

interface DirectMessageProps {
  roomUuid: string;
  onBack: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ roomUuid, onBack }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await fetchMessagesByRoom(roomUuid);
        setMessages(initialMessages); // ✅ 초기 메시지 세팅
      } catch (err) {
        console.error("이전 메시지 불러오기 실패:", err);
      }
    };

    loadMessages();
    joinChatRoom(roomUuid);

    // 실시간 메시지 수신 처리
    const handleReceive = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [roomUuid]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    sendMessageSocket(roomUuid, input);
    setInput("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80 h-full p-4 flex flex-col">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold">채팅방</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto text-sm text-gray-700 space-y-2 mb-2">
        {messages.map((msg, idx) => (
          <div key={msg.uuid ?? idx} className="p-2 bg-gray-100 rounded">
            <p className="text-xs text-gray-500">{msg.sender_uuid}</p>
            <p>{msg.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
