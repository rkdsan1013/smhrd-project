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
    SELECT u.uuid, u.email, up.name, up.gender, up.birthdate, up.paradox_flag AS paradoxFlag, up.profile_picture AS profilePicture
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid 
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

// 사용자 프로필 업데이트 (이름, 프로필 사진 업데이트)
const updateUserProfile = async (uuid, updateData) => {
  // 전달된 updateData에서 업데이트할 필드를 동적으로 구성
  let fields = [];
  let params = { uuid };

  if (typeof updateData.name !== "undefined") {
    fields.push("name = :name");
    params.name = updateData.name;
  }
  // profilePicture 필드가 전달된 경우에만 처리 (예: req.file이 있을 때)
  if (Object.prototype.hasOwnProperty.call(updateData, "profilePicture")) {
    fields.push("profile_picture = :profilePicture");
    params.profilePicture = updateData.profilePicture;
  }

  // 업데이트 할 필드가 없다면 null 반환 (혹은 적절한 예외 처리)
  if (fields.length === 0) return null;

  const sql = `UPDATE user_profiles SET ${fields.join(", ")} WHERE uuid = :uuid`;
  const [result] = await pool.query(sql, params);

  // 업데이트가 실패했을 경우
  if (result.affectedRows === 0) return null;
  const [rows] = await pool.query("SELECT * FROM user_profiles WHERE uuid = :uuid", { uuid });
  return rows[0];
};

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  updateUserProfile,
  getProfileByUuid,
};
