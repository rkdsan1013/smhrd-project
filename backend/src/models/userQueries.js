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

const getUserProfileByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.birthdate, up.gender, up.profile_picture 
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid 
    WHERE u.uuid = ?`;
  try {
    const [rows] = await pool.query(sql, [uuid]);
    console.log("[getUserProfileByUuid] Query result for uuid", uuid, rows);
    return rows[0];
  } catch (error) {
    console.error("[getUserProfileByUuid] Error executing query for uuid", uuid, error);
    throw error;
  }
};

module.exports = { 
  getUserByEmail, 
  updateUserProfilePicture,
  getUserProfileByUuid  // getUserProfileByUuid 함수가 올바르게 export 되었는지 확인합니다.
};