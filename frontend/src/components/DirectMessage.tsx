// /frontend/src/components/DirectMessage.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  // DM 모달의 초기 위치를 오버라이딩할 수 있도록, top/left 또는 bottom/right (문자열, 예: { top: "150", left: "150" } 또는 { bottom: "1rem", right: "1rem" })
  positionOffset?: { top?: string; left?: string; bottom?: string; right?: string };
  // 상대방의 이름을 전달받아 헤더에 표시
  friendName: string;
  // DM 창이 포커스되었을 때 호출되는 콜백
  onFocus?: () => void;
  // zIndex를 통해 마지막에 포커스된 창이 위로 노출되도록 함
  zIndex?: number;
}

const DirectMessage: React.FC<DirectMessageProps> = ({
  roomUuid,
  currentUserUuid,
  onBack,
  positionOffset,
  friendName,
  onFocus,
  zIndex,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();

  const baseInputClass =
    "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
  const labelClass =
    "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // 모달 고정 크기
  const modalWidth = 384; // w-96 (24rem * 16)
  const modalHeight = 500; // h-[500px]

  // 초기 위치를 한 번만 계산 (useMemo를 사용하여 컴포넌트 마운트 시 한 번만 계산)
  const computedInitialPos = useMemo(() => {
    if (positionOffset?.top || positionOffset?.left) {
      return {
        top: positionOffset.top ? parseInt(positionOffset.top, 10) : 100,
        left: positionOffset.left ? parseInt(positionOffset.left, 10) : 100,
      };
    } else if (positionOffset?.bottom || positionOffset?.right) {
      const bottomPx = positionOffset.bottom ? parseFloat(positionOffset.bottom) * 16 : 16;
      const rightPx = positionOffset.right ? parseFloat(positionOffset.right) * 16 : 16;
      return {
        top: window.innerHeight - modalHeight - bottomPx,
        left: window.innerWidth - modalWidth - rightPx,
      };
    } else {
      return {
        top: window.innerHeight - modalHeight - 16,
        left: window.innerWidth - modalWidth - 16,
      };
    }
  }, []);

  const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>(
    computedInitialPos,
  );

  // 창 크기 변경 시 현재 modalPosition이 화면 내에 있도록 clamp 처리
  useEffect(() => {
    const handleResize = () => {
      setModalPosition((prev) => {
        let newLeft = prev.left;
        let newTop = prev.top;
        newLeft = Math.min(newLeft, window.innerWidth - modalWidth);
        newLeft = Math.max(newLeft, 0);
        newTop = Math.min(newTop, window.innerHeight - modalHeight);
        newTop = Math.max(newTop, 0);
        return { top: newTop, left: newLeft };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [modalWidth, modalHeight]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        // 서버의 채팅방 식별자는 room_uuid입니다.
        if (msg.room_uuid !== roomUuid) return;
        setMessages((prev) => [...prev, msg]);
      };

      socket.on("receiveMessage", handleReceive);
      return () => {
        socket.off("receiveMessage", handleReceive);
      };
    }
  }, [roomUuid, socket]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStart) return;
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // 계산한 새 위치를 clamp 처리
      let newLeft = modalPosition.left + deltaX;
      let newTop = modalPosition.top + deltaY;
      newLeft = Math.min(Math.max(newLeft, 0), window.innerWidth - modalWidth);
      newTop = Math.min(Math.max(newTop, 0), window.innerHeight - modalHeight);
      setModalPosition({ left: newLeft, top: newTop });
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
      }
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, modalPosition]);

  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onBack();
    }, 300);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed"
      style={{
        top: modalPosition.top + "px",
        left: modalPosition.left + "px",
        zIndex: zIndex ? zIndex : 50,
      }}
      onMouseDown={() => {
        if (onFocus) onFocus();
      }}
    >
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 헤더: 상대방 이름 영역과 닫기 버튼 영역 분리 */}
        <div
          className="flex items-center w-full p-4 border-b border-gray-200 cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{friendName}</h2>
          </div>
          <div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleModalClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
            >
              <Icons name="close" className="w-6 h-6 text-gray-600" />
            </button>
          </div>
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
            <div className="relative flex-1">
              <input
                type="text"
                id="message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=" "
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
