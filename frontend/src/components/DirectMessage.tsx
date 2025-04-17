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
  positionOffset?: { top?: string; left?: string; bottom?: string; right?: string };
  friendName: string;
  onFocus?: () => void;
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

  // 모달 크기를 TailwindCSS 단위(= rem)로 정의
  // Tailwind의 w-96는 24rem (24 * 16 = 384px)이고,
  // 500px ≒ 31.25rem (500 / 16)로 변환할 수 있습니다.
  const MODAL_WIDTH_REM = 24; // 24rem
  const MODAL_HEIGHT_REM = 31.25; // 31.25rem (약 500px)
  const modalWidthPx = MODAL_WIDTH_REM * 16; // 384px
  const modalHeightPx = MODAL_HEIGHT_REM * 16; // 500px

  // 최초 위치는 한 번만 계산 (계산된 값을 픽셀 단위로 처리)
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
        top: window.innerHeight - modalHeightPx - bottomPx,
        left: window.innerWidth - modalWidthPx - rightPx,
      };
    } else {
      return {
        top: window.innerHeight - modalHeightPx - 16,
        left: window.innerWidth - modalWidthPx - 16,
      };
    }
  }, [positionOffset, modalWidthPx, modalHeightPx]);

  const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>(
    computedInitialPos,
  );

  // 창 크기 변경 시 모달이 화면 내에 있도록 clamp 처리
  useEffect(() => {
    const handleResize = () => {
      setModalPosition((prev) => {
        let newLeft = prev.left;
        let newTop = prev.top;
        newLeft = Math.min(newLeft, window.innerWidth - modalWidthPx);
        newLeft = Math.max(newLeft, 0);
        newTop = Math.min(newTop, window.innerHeight - modalHeightPx);
        newTop = Math.max(newTop, 0);
        return { top: newTop, left: newLeft };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [modalWidthPx, modalHeightPx]);

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
      let newLeft = modalPosition.left + deltaX;
      let newTop = modalPosition.top + deltaY;
      newLeft = Math.min(Math.max(newLeft, 0), window.innerWidth - modalWidthPx);
      newTop = Math.min(Math.max(newTop, 0), window.innerHeight - modalHeightPx);
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
  }, [isDragging, dragStart, modalPosition, modalWidthPx, modalHeightPx]);

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
        className={`relative bg-white rounded-lg shadow-xl w-96 h-[31.25rem] flex flex-col transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 헤더: 상대방 이름과 닫기 버튼 */}
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

        {/* 메시지 콘텐츠 영역 */}
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

        {/* 푸터: 입력창 및 전송 버튼 */}
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
