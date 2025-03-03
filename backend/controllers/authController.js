// /controllers/authController.js

const bcrypt = require('bcrypt');
const { validateEmail, validatePassword } = require('../utils/validators');
const userModel = require('../models/userModel');

// 아이디 존재 여부 확인
const checkEmail = (req, res) => {
  const { email } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: '유효한 이메일 주소를 입력하세요.' });
  }

  userModel.getUserByEmail(email, (err, results) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } else {
      res.json({ exists: results.length > 0 });
    }
  });
};

// 회원가입 처리
const signUp = async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: '유효한 이메일 주소를 입력하세요.' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    userModel.createUser(email, hashedPassword, (err) => {
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
};

// 로그인 처리
const signIn = (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res
      .status(400)
      .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

  userModel.getUserByEmail(email, async (err, results) => {
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
          res
            .status(400)
            .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
      } catch (err) {
        console.error('비밀번호 비교 오류:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
    } else {
      res
        .status(400)
        .json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
  });
};

module.exports = {
  checkEmail,
  signUp,
  signIn,
};
