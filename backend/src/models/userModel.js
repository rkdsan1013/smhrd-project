// /backend/src/models/userModel.js
const db = require('../config/db');

// 이메일로 사용자 조회 시 uuid, email, password를 반환합니다.
const getUserByEmail = (email, callback) => {
  const sql = 'SELECT uuid, email, password FROM users WHERE email = ?';
  db.query(sql, [email], callback);
};

// 신규 사용자 생성 (uuid는 DB에서 자동 생성됩니다.)
const createUser = (email, hashedPassword, callback) => {
  const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.query(sql, [email, hashedPassword], callback);
};

module.exports = {
  getUserByEmail,
  createUser,
};