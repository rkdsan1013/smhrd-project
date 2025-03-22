// /backend/src/server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

// 환경변수 로드
dotenv.config();

const app = express();

// CORS 설정
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// JSON 파싱
app.use(express.json());
// 쿠키 파싱
app.use(cookieParser());
// 정적 파일 제공 (uploads 폴더)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// API 라우트 설정
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
