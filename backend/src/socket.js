// /backend/src/socket.js
const { Server } = require("socket.io");
const cookie = require("cookie");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");

// 핸들러 모듈 가져오기
const messageHandler = require("./handlers/message");

const initSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // 인증 미들웨어: 클라이언트가 보내는 쿠키에서 accessToken 추출 후 jwtVerify로 검증
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;
      if (!token) {
        console.error("인증 실패: accessToken 쿠키 없음");
        return next(new Error("Authentication error: Token missing"));
      }
      const { payload } = await jwtVerify(token, secretKey);
      socket.user = payload; // 이후 이벤트에서 사용자 정보를 활용
      next();
    } catch (error) {
      console.error("토큰 검증 실패:", error);
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // 기능별 핸들러 호출 (여기서는 메시지 핸들러를 등록)
    messageHandler(socket, io);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = { initSocketIO };
