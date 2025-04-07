// /frontend/src/components/DirectMessage.tsx

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  sendMessageSocket,
  joinChatRoom,
  fetchMessagesByRoom,
  ChatMessage,
} from "../services/chatService";
import { useSocket } from "../contexts/SocketContext";
import Icons from "./Icons";

interface DirectMessageProps {
  roomUuid: string;
  currentUserUuid: string;
  onBack: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ roomUuid, currentUserUuid, onBack }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();

  // 플로팅 라벨 입력칸 관련 클래스 (참고: input을 위한 peer + label 애니메이션)
  const baseInputClass =
    "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
  const labelClass =
    "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

  // 모달 마운트 시 fade‑in 효과
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 채팅방의 초기 메시지를 불러오고 소켓 이벤트를 설정합니다.
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

  // 메시지가 변경될 때마다 가장 하단으로 스크롤 처리합니다.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;
    sendMessageSocket(socket, roomUuid, input);
    setInput("");
  };

  // 엔터 키 입력 시 메시지를 전송합니다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 모달 종료 시 fade‑out 효과 적용 후 onBack() 호출
  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onBack();
    }, 300);
  };

  return ReactDOM.createPortal(
    // 우하단에 고정되도록 수정 (배경 오버레이는 제거됨)
    <div className="fixed bottom-4 right-4 z-50">
      {/* 모달 컨테이너 */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">채팅방</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.map((msg, idx) =>
            msg.sender_uuid === currentUserUuid ? (
              <div key={msg.uuid ?? idx} className="flex justify-end pl-1 mb-2">
                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-[70%] break-words">
                  {msg.message}
                </div>
              </div>
            ) : (
              <div key={msg.uuid ?? idx} className="flex items-start space-x-2 mb-2">
                {msg.sender_picture ? (
                  <img
                    src={msg.sender_picture}
                    alt={msg.sender_name}
                    className="w-8 h-8 rounded-full object-cover mt-1"
                  />
                ) : (
                  // 프로필 사진이 없을 경우 기본 아이콘 없이 동일한 크기의 빈 placeholder만 표시
                  <div className="w-8 h-8 bg-gray-300 rounded-full mt-1"></div>
                )}
                <div className="bg-gray-100 px-3 py-2 rounded-lg max-w-[70%] break-words">
                  <p className="text-xs text-gray-500 mb-1 truncate">{msg.sender_name}</p>
                  <p>{msg.message}</p>
                </div>
              </div>
            ),
          )}
          <div ref={scrollRef} />
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 items-end">
            {/* 플로팅 라벨 입력칸 */}
            <div className="relative flex-1">
              <input
                type="text"
                id="message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=" " // placeholder 는 공백 처리하여 label 표시
                className={baseInputClass}
              />
              <label htmlFor="message" className={labelClass}>
                메시지를 입력하세요
              </label>
            </div>
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            >
              <Icons name="send" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DirectMessage;
