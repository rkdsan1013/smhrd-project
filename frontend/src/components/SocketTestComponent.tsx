// /frontend/src/components/SocketTestComponent.tsx
import React, { useState, useEffect } from "react";
import socket from "../services/socket";

const SocketTestComponent: React.FC = () => {
  // 수신된 메시지를 저장할 상태 및 입력필드 상태 관리
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // 컴포넌트가 마운트되면 "message" 이벤트를 구독하여 서버로부터 메시지를 수신
  useEffect(() => {
    const handleMessage = (data: string) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, data]);
    };

    socket.on("message", handleMessage);

    // 컴포넌트 언마운트 시 이벤트 리스너 해제
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  // "Send Message" 버튼 클릭 시 메시지를 서버에 전송
  const sendMessage = () => {
    if (input.trim()) {
      socket.emit("message", input.trim());
      setInput("");
    } else {
      // 입력이 없는 경우 기본 테스트 메시지 전송
      socket.emit("message", "테스트 메시지");
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem" }}>
      <h2>Socket Test Component</h2>
      <div>
        <strong>Socket ID:</strong> {socket.id || "연결 중..."}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력해주세요..."
          style={{ padding: "0.5rem", width: "70%" }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0.5rem 1rem",
            marginLeft: "0.5rem",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          전송
        </button>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h3>수신 메시지</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocketTestComponent;
