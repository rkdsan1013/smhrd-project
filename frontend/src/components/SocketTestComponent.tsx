// /frontend/src/components/SocketTestComponent.tsx
import React, { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

interface ChatMessage {
  username: string;
  content: string;
}

const SocketTestComponent: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!socket) return; // socket이 아직 초기화되지 않았다면 탈출

    const handleMessage = (data: any) => {
      if (data && typeof data === "object" && data.username && data.content) {
        setMessages((prev) => [...prev, data]);
      } else if (typeof data === "string") {
        setMessages((prev) => [...prev, { username: "System", content: data }]);
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    if (!socket) return;
    if (message.trim()) {
      const chatMessage: ChatMessage = {
        username: "Test User",
        content: message.trim(),
      };
      socket.emit("message", chatMessage);
      setMessage("");
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem" }}>
        <h2>Socket Test Component</h2>
        <p>Connecting...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem" }}>
      <h2>Socket Test Component</h2>
      <div>
        <strong>Socket ID:</strong> {socket?.id}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력해주세요..."
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
      <div style={{ marginTop: "1rem" }}>
        <h3>수신 메시지</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              <strong>{msg.username}:</strong> {msg.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocketTestComponent;
