// /frontend/src/components/GroupChat.tsx
import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import {
  sendMessageSocket,
  joinChatRoom,
  fetchMessagesByRoom,
  ChatMessage,
} from "../services/chatService";
import { useSocket } from "../contexts/SocketContext";
import Icons from "./Icons";

interface GroupChatProps {
  roomUuid: string;
  currentUserUuid: string;
  roomName: string;
}

const GroupChat: React.FC<GroupChatProps> = ({ roomUuid, currentUserUuid, roomName }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();

  const baseInputClass =
    "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
  const labelClass =
    "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await fetchMessagesByRoom(roomUuid);
        setMessages(initialMessages);
      } catch (error) {
        console.error("메시지 로드 실패:", error);
      }
    };
    loadMessages();

    if (socket) {
      joinChatRoom(socket, roomUuid);
      const handleReceive = (msg: ChatMessage) => {
        if (msg.room_uuid === roomUuid) {
          setMessages((prev) => [...prev, msg]);
        }
      };
      socket.on("receiveMessage", handleReceive);
      return () => {
        socket.off("receiveMessage", handleReceive);
      };
    }
  }, [roomUuid, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;
    sendMessageSocket(socket, roomUuid, input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더: 채팅룸 제목 */}
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold">{roomName}</h2>
      </div>

      {/* 메시지 영역: 배경색을 bg-white로 통일 */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.map((msg, idx) =>
          msg.sender_uuid === currentUserUuid ? (
            <div key={msg.uuid ?? idx} className="flex justify-end mb-2">
              <div className="py-2 px-3 rounded-lg max-w-[70%] break-words bg-blue-500 text-white">
                {msg.message}
              </div>
            </div>
          ) : (
            <div key={msg.uuid ?? idx} className="flex mb-2 space-x-2">
              {msg.sender_picture ? (
                <img
                  src={msg.sender_picture}
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300" />
              )}
              <div className="py-2 px-3 rounded-lg max-w-[70%] break-words bg-gray-200 text-gray-800">
                <p className="text-xs font-medium mb-1">{msg.sender_name}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ),
        )}
        <div ref={scrollRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              id="groupChatInput"
              placeholder=" "
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClass}
            />
            <label htmlFor="groupChatInput" className={labelClass}>
              메시지를 입력하세요...
            </label>
          </div>
          <button
            onClick={handleSendMessage}
            className="ml-4 w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center transition-all duration-300"
          >
            <Icons name="send" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
