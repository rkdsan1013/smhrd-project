// /backend/src/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

// 환경 변수 로드
dotenv.config();

const app = express();

// CORS 설정: 프론트엔드 URL 기반, credentials 허용
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// JSON 파서 및 쿠키 파서 미들웨어 설정
app.use(express.json());
app.use(cookieParser());

// 라우터 설정
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});