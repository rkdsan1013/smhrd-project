// /frontend/src/components/SocketTestComponent.tsx
import React, { useState, useEffect } from "react";
import socket from "../services/socket";

interface ChatMessage {
  username: string;
  content: string;
}

const SocketTestComponent: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");

  // async/await를 사용하여 Socket.IO 연결 이벤트를 기다리는 함수
  const waitForSocketConnection = async (): Promise<void> => {
    if (socket.connected) {
      // 이미 연결되어 있다면 바로 반환
      return;
    }
    await new Promise<void>((resolve) => {
      // "connect" 이벤트가 발생하면 resolve() 호출
      socket.once("connect", () => {
        console.log("Connected using async/await! Socket ID:", socket.id);
        resolve();
      });
    });
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 async 함수를 실행하여 연결 완료를 기다림
    (async () => {
      try {
        await waitForSocketConnection();
        setIsConnected(true);
      } catch (error) {
        console.error("Socket 연결 중 에러 발생:", error);
        setIsConnected(false);
      }
    })();

    // 연결 끊김 이벤트 처리(필요한 경우)
    const handleDisconnect = () => {
      console.log("Disconnected from WebSocket 서버.");
      setIsConnected(false);
    };
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
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
  }, []);

  const sendMessage = () => {
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
        <strong>Socket ID:</strong> {socket.id}
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
