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
    SELECT u.uuid, u.email, up.name, up.gender, up.birthdate, up.profile_picture 
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid 
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

// uuid로 친구 목록 조회
const getFriendsByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, up.name
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid
    INNER JOIN friends f ON u.uuid = f.friend_uuid
    WHERE f.user_uuid = :uuid AND f.status = 'accepted'
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows;
};

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  getProfileByUuid,
  getFriendsByUuid,
};
