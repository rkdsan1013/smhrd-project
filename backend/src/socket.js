const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel"); // ✅ 추가

const initSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }
      const { payload } = await jwtVerify(token, secretKey);
      socket.user = payload;
      next();
    } catch (error) {
      console.error("토큰 검증 실패:", error);
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket 연결됨:", socket.id);

    //  채팅방 입장
    socket.on("joinRoom", (roomUuid) => {
      socket.join(roomUuid);
    });

    //  메시지 수신 + DB 저장
    socket.on("sendMessage", async ({ roomUuid, message }) => {
      try {
        const senderUuid = socket.user.uuid;
        const savedMessage = await chatModel.saveMessage(roomUuid, senderUuid, message); // DB 저장
        io.to(roomUuid).emit("receiveMessage", savedMessage); // 실시간 전송
      } catch (err) {
        console.error("메시지 저장 오류:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket 연결 종료:", socket.id);
    });
  });
};

module.exports = { initSocketIO };
