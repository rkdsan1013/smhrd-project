// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const validator = require('validator'); // validator 라이브러리 임포트

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 오류:', err);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
  console.log('MySQL Connected...');
});

// 입력값 검증을 위한 상수 및 유효성 검사 함수 추가
const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 60; // bcrypt 제한 최대 72바이트

const validateEmail = (email) => {
  return (
    typeof email === 'string' &&
    email.length >= MIN_EMAIL_LENGTH &&
    email.length <= MAX_EMAIL_LENGTH &&
    validator.isEmail(email)
  );
};

const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { valid: false, message: '비밀번호를 입력해주세요.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.`,
    };
  }
  if (!validator.isAscii(password)) {
    return {
      valid: false,
      message: '비밀번호는 ASCII 문자만 사용 가능합니다.',
    };
  }
  return { valid: true };
};

// 아이디 존재 여부 확인
app.post('/check-email', (req, res) => {
  const { email } = req.body;

  // 이메일 검증
  if (!validateEmail(email)) {
    return res.status(400).json({ message: '유효한 이메일 주소를 입력하세요.' });
  }

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

  // 이메일 검증
  if (!validateEmail(email)) {
    return res.status(400).json({ message: '유효한 이메일 주소를 입력하세요.' });
  }

  // 비밀번호 검증
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res
      .status(400)
      .json({ message: passwordValidation.message || '비밀번호가 유효하지 않습니다.' });
  }

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
app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  // 이메일 검증
  if (!validateEmail(email)) {
    return res.status(400).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

  // 비밀번호 검증
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res
      .status(400)
      .json({ message: passwordValidation.message || '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

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
