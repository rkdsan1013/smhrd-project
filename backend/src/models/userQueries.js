// /backend/src/models/userQueries.js
const pool = require("../config/db");

// 이메일로 사용자 조회
const getUserByEmail = async (email) => {
  const sql = "SELECT uuid, email, password FROM users WHERE email = :email";
  const [rows] = await pool.query(sql, { email });
  return rows;
};

// 사용자 프로필 사진 업데이트
const updateUserProfilePicture = async (uuid, profilePicture) => {
  const sql = "UPDATE user_profiles SET profile_picture = :profilePicture WHERE uuid = :uuid";
  const [result] = await pool.query(sql, { profilePicture, uuid });
  return result;
};

// uuid로 사용자 프로필 조회
const getProfileByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.birthdate, up.gender, up.profile_picture 
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid 
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  getProfileByUuid,
};
