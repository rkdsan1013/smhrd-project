// /backend/src/models/userModel.js
const db = require('../config/db');

const getUserByEmail = async (email) => {
  const sql = 'SELECT uuid, email, password FROM users WHERE email = ?';
  const [rows] = await db.query(sql, [email]);
  return rows;
};

const createUser = async (email, hashedPassword, connection) => {
  const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
  const [result] = await connection.query(sql, [email, hashedPassword]);
  return result;
};

const createUserProfile = async (uuid, name, birthdate, gender, profilePicture, connection) => {
  const sql = `INSERT INTO user_profiles (uuid, name, birthdate, gender, profile_picture)
               VALUES (?, ?, ?, ?, ?)`;
  const [result] = await connection.query(sql, [uuid, name, birthdate, gender, profilePicture]);
  return result;
};

const updateUserProfilePicture = async (uuid, profilePicture) => {
  const sql = "UPDATE user_profiles SET profile_picture = ? WHERE uuid = ?";
  const [result] = await db.query(sql, [profilePicture, uuid]);
  return result;
};

/**
 * signUpUser는 users와 user_profiles 테이블에 데이터를 저장하는 트랜잭션 함수입니다.
 * profile_picture는 최초에는 null로 저장하며, 이후 컨트롤러에서 업데이트합니다.
 */
const signUpUser = async (email, hashedPassword, name, birthdate, gender) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await createUser(email, hashedPassword, connection);

    const [rows] = await connection.query("SELECT uuid, email FROM users WHERE email = ?", [email]);
    if (!rows || rows.length === 0) {
      throw new Error("회원가입 후 사용자 조회에 실패했습니다.");
    }
    const user = rows[0];

    await createUserProfile(user.uuid, name, birthdate, gender, null, connection);

    await connection.commit();
    connection.release();
    return user;
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};

module.exports = {
  getUserByEmail,
  signUpUser,
  updateUserProfilePicture,
};