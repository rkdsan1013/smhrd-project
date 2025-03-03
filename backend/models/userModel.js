// /models/userModel.js

const db = require('../config/db');

const getUserByEmail = (email, callback) => {
  const sql = 'SELECT email, password FROM users WHERE email = ?';
  db.query(sql, [email], callback);
};

const createUser = (email, hashedPassword, callback) => {
  const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.query(sql, [email, hashedPassword], callback);
};

module.exports = {
  getUserByEmail,
  createUser,
};
