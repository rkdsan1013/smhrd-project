// /frontend/src/components/SocketTestComponent.tsx
import React, { useState, useEffect } from "react";
import socket from "../services/socket";

// 메시지 객체의 인터페이스 정의
interface ChatMessage {
  username: string;
  content: string;
}

const SocketTestComponent: React.FC = () => {
  // 사용자가 입력할 닉네임과 참여 후 설정된 닉네임 상태
  const [username, setUsername] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");

  // 전송할 메시지와 수신된 메시지 목록 상태
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Socket.IO의 "message" 이벤트 구독 – 서버에서 메시지를 수신
  useEffect(() => {
    const handleMessage = (data: any) => {
      // data가 객체 형태일 경우 username과 content 속성이 있는지 확인
      if (data && typeof data === "object" && data.username && data.content) {
        setMessages((prev) => [...prev, data]);
      } else if (typeof data === "string") {
        // 문자열이면 시스템 메시지로 처리
        setMessages((prev) => [...prev, { username: "System", content: data }]);
      }
    };

    socket.on("message", handleMessage);

    // 언마운트 시 이벤트 리스너 해제
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  // 닉네임을 설정하여 채팅에 참여하는 함수
  const joinChat = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
    }
  };

  // 메시지를 전송하는 함수
  const sendMessage = () => {
    if (message.trim() && username) {
      const chatMessage: ChatMessage = {
        username,
        content: message.trim(),
      };
      socket.emit("message", chatMessage);
      setMessage("");
    }
  };

  // 닉네임 미설정 시 참여 폼 렌더링
  if (!username) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem" }}>
        <h2>채팅에 참여하기</h2>
        <input
          type="text"
          value={tempUsername}
          onChange={(e) => setTempUsername(e.target.value)}
          placeholder="사용자 이름 입력"
          style={{ padding: "0.5rem", width: "70%", marginRight: "0.5rem" }}
        />
        <button
          onClick={joinChat}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          참여하기
        </button>
      </div>
    );
  }

  // 닉네임 설정 후 채팅창 렌더링
  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem" }}>
      <h2>채팅방 - Socket Test Component</h2>
      <div>
        <strong>사용자:</strong> {username}
      </div>
      <div
        style={{
          marginTop: "1rem",
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #eee",
          padding: "0.5rem",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "0.5rem" }}>
            <strong>{msg.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          style={{ padding: "0.5rem", width: "70%", marginRight: "0.5rem" }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default SocketTestComponent;
