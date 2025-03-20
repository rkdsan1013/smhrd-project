// /backend/src/models/userQueries.js
const pool = require('../config/db');

const getUserByEmail = async (email) => {
  const sql = 'SELECT uuid, email, password FROM users WHERE email = ?';
  const [rows] = await pool.query(sql, [email]);
  return rows;
};

const updateUserProfilePicture = async (uuid, profilePicture) => {
  const sql = "UPDATE user_profiles SET profile_picture = ? WHERE uuid = ?";
  const [result] = await pool.query(sql, [profilePicture, uuid]);
  return result;
};

module.exports = { getUserByEmail, updateUserProfilePicture };