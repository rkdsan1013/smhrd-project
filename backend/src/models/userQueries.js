// /backend/src/models/userQueries.js
const pool = require("../config/db");

// === Users 테이블 관련 ===

// 이메일로 사용자 조회
const getUserByEmail = async (email) => {
  const sql = "SELECT uuid, email, password FROM users WHERE email = :email";
  const [rows] = await pool.query(sql, { email });
  return rows;
};

// UUID로 사용자 조회
const getUserByUuid = async (uuid) => {
  const sql = "SELECT uuid, email, password FROM users WHERE uuid = :uuid";
  const [rows] = await pool.query(sql, { uuid });
  return rows;
};

// 사용자 비밀번호 변경 (users 테이블)
const changeUserPassword = async (uuid, newPassword) => {
  const sql = "UPDATE users SET password = :newPassword WHERE uuid = :uuid";
  const [result] = await pool.query(sql, { newPassword, uuid });
  return result;
};

// UUID로 사용자 삭제
const deleteUserByUuid = async (uuid) => {
  const sql = "DELETE FROM users WHERE uuid = :uuid";
  const [result] = await pool.query(sql, { uuid });
  return result;
};

// === User Profiles 관련 ===

// UUID로 사용자 프로필 조회 (users와 user_profiles 조인)
const getProfileByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.gender, up.birthdate, up.paradox_flag AS paradoxFlag, up.profile_picture AS profilePicture
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid 
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

// 사용자 프로필 사진 업데이트 (user_profiles 테이블)
const updateUserProfilePicture = async (uuid, profilePicture) => {
  const sql = "UPDATE user_profiles SET profile_picture = :profilePicture WHERE uuid = :uuid";
  const [result] = await pool.query(sql, { profilePicture, uuid });
  return result;
};

// 사용자 프로필 업데이트 (이름 및 프로필 사진) - 업데이트할 필드를 동적으로 구성
const updateUserProfile = async (uuid, updateData) => {
  let fields = [];
  let params = { uuid };

  if (typeof updateData.name !== "undefined") {
    fields.push("name = :name");
    params.name = updateData.name;
  }
  if (Object.prototype.hasOwnProperty.call(updateData, "profilePicture")) {
    fields.push("profile_picture = :profilePicture");
    params.profilePicture = updateData.profilePicture;
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE user_profiles SET ${fields.join(", ")} WHERE uuid = :uuid`;
  const [result] = await pool.query(sql, params);

  if (result.affectedRows === 0) return null;
  const [rows] = await pool.query("SELECT * FROM user_profiles WHERE uuid = :uuid", { uuid });
  return rows[0];
};

module.exports = {
  getUserByEmail,
  getUserByUuid,
  changeUserPassword,
  deleteUserByUuid,
  getProfileByUuid,
  updateUserProfilePicture,
  updateUserProfile,
};
