// /backend/src/models/userTransactions.js
const pool = require("../config/db");

// 사용자 생성 함수
const createUser = async (email, hashedPassword, connection) => {
  const sql = "INSERT INTO users (email, password) VALUES (:email, :hashedPassword)";
  const [result] = await connection.query(sql, { email, hashedPassword });
  return result;
};

// 사용자 프로필 생성 함수
const createUserProfile = async (uuid, name, birthdate, gender, profilePicture, connection) => {
  const sql = `
    INSERT INTO user_profiles (uuid, name, birthdate, gender, profile_picture)
    VALUES (:uuid, :name, :birthdate, :gender, :profilePicture)
  `;
  const [result] = await connection.query(sql, { uuid, name, birthdate, gender, profilePicture });
  return result;
};

// 회원가입 함수
const signUpUser = async (email, hashedPassword, name, birthdate, gender) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await createUser(email, hashedPassword, connection);

    const [rows] = await connection.query("SELECT uuid, email FROM users WHERE email = :email", {
      email,
    });
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

module.exports = { signUpUser };
