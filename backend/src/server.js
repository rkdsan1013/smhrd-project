// /backend/src/server.js

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

// 환경변수 로딩
dotenv.config();

// 라우트 모듈 불러오기
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// 기본 미들웨어 설정 (JSON 파싱, 쿠키 파서)
app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공 (업로드 파일 경로)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/schedules", scheduleRoutes);

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5000;

// HTTP 서버 생성
const server = http.createServer(app);

// 소켓 초기화 및 Express 앱에 삽입
const { initSocketIO } = require("./socket");
const io = initSocketIO(server); // 소켓 서버 생성
app.set("io", io); // Express 앱에 소켓 인스턴스 등록

// 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
