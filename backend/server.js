// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 오류:', err);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
  console.log('MySQL Connected...');
});

// 아이디 존재 여부 확인
app.post('/check-email', (req, res) => {
  const { email } = req.body;
  const sql = 'SELECT email FROM users WHERE email = ?';

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } else {
      res.json({ exists: results.length > 0 });
    }
  });
});

// 회원가입 처리
app.post('/sign-up', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(sql, [email, hashedPassword], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
        } else {
          console.error('데이터베이스 삽입 오류:', err);
          res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
      } else {
        res.json({ success: true });
      }
    });
  } catch (err) {
    console.error('비밀번호 해시화 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 처리
app.post('/sign-in', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT email, password FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } else if (results.length > 0) {
      const user = results[0];
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          res.json({ success: true });
        } else {
          res.status(400).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
      } catch (err) {
        console.error('비밀번호 비교 오류:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
    } else {
      res.status(400).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
  });
});

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
