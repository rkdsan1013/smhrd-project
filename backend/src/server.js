// /backend/src/server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

// 환경변수 로드
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const voteRoutes = require("./routes/voteRoutes");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// JSON 및 쿠키 파싱
app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공 (uploads 폴더)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API 라우트 설정
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/votes", voteRoutes);

// 글로벌 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
