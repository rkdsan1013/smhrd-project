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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();
  const prevMessagesLength = useRef(0);

  const baseInputClass =
    "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
  const labelClass =
    "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const initialMessages = await fetchMessagesByRoom(roomUuid);
        setMessages(initialMessages);
        prevMessagesLength.current = initialMessages.length;
      } catch (error: any) {
        const errMsg =
          error.response?.status === 403
            ? "이 채팅방에 접근할 권한이 없습니다."
            : "메시지를 불러오는 데 실패했습니다.";
        setError(errMsg);
        console.error(`[GroupChat] 메시지 로드 실패 (room ${roomUuid}): ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    if (socket) {
      joinChatRoom(socket, roomUuid);
      console.log(`[GroupChat] 소켓 채팅방 입장: ${roomUuid}`);

      const handleReceive = (msg: ChatMessage) => {
        if (msg.room_uuid === roomUuid) {
          setMessages((prev) => [...prev, msg]);
          console.log(`[GroupChat] 수신된 메시지 (room ${roomUuid}):`, msg);
        }
      };

      socket.on("receiveMessage", handleReceive);
      socket.on("connect_error", (err) => {
        console.error(`[GroupChat] 소켓 연결 실패: ${err.message}`);
        setError("채팅 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      });

      return () => {
        socket.off("receiveMessage", handleReceive);
        socket.off("connect_error");
      };
    } else {
      console.warn("[GroupChat] 소켓 연결 없음");
      setError("채팅 서버에 연결할 수 없습니다.");
    }
  }, [roomUuid, socket]);

  // 새 메시지 추가 시에만 스크롤 이동
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
      prevMessagesLength.current = messages.length;
    }
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
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{roomName}</h2>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 p-6 overflow-y-auto bg-white">
        {loading && <p className="text-center text-gray-500">메시지를 불러오는 중...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center text-gray-500">메시지가 없습니다.</p>
        )}
        {!loading &&
          !error &&
          messages.map((msg, idx) =>
            msg.sender_uuid === currentUserUuid ? (
              <div key={msg.uuid || idx} className="flex justify-end pl-1 mb-2">
                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-[70%] break-words">
                  {msg.message}
                </div>
              </div>
            ) : (
              <div key={msg.uuid || idx} className="flex items-start space-x-2 mb-2">
                {msg.sender_picture ? (
                  <img
                    src={msg.sender_picture}
                    alt={msg.sender_name}
                    className="w-8 h-8 rounded-full object-cover mt-1"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full mt-1" />
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

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <input
              type="text"
              id="groupChatInput"
              placeholder=" "
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClass}
              disabled={!!error} // 에러 시 입력 비활성화
            />
            <label htmlFor="groupChatInput" className={labelClass}>
              메시지를 입력하세요
            </label>
          </div>
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-gray-400"
            disabled={!!error}
          >
            <Icons name="send" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
