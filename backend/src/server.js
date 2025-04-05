// /backend/src/server.js

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공 (예: uploads 폴더)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API 라우트 설정
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chats", chatRoutes);

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5000;

// Express 앱을 포함한 HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 초기화 (웹소켓 기능 추가)
const { initSocketIO } = require("./socket");
initSocketIO(server);

// 서버 실행
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
