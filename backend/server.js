// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 라우트 설정
app.use('/', authRoutes);

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
