// /backend/src/models/userTransactions.js
const pool = require("../config/db");

// 사용자 생성 (users 테이블)
const createUser = async (email, hashedPassword, connection) => {
  const sql = "INSERT INTO users (email, password) VALUES (:email, :hashedPassword)";
  const [result] = await connection.query(sql, { email, hashedPassword });
  return result;
};

// 사용자 프로필 생성 (user_profiles 테이블)
const createUserProfile = async (
  uuid,
  name,
  gender,
  birthdate,
  paradoxFlag,
  profilePicture,
  connection,
) => {
  const sql = `
    INSERT INTO user_profiles (uuid, name, gender, birthdate, paradox_flag, profile_picture)
    VALUES (:uuid, :name, :gender, :birthdate, :paradoxFlag, :profilePicture)
  `;
  const [result] = await connection.query(sql, {
    uuid,
    name,
    gender,
    birthdate,
    paradoxFlag,
    profilePicture,
  });
  return result;
};

// 회원가입 트랜잭션 (사용자 및 프로필 생성)
const signUpUser = async (email, hashedPassword, name, gender, birthdate, paradoxFlag) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await createUser(email, hashedPassword, connection);

    const [rows] = await connection.query("SELECT uuid, email FROM users WHERE email = :email", {
      email,
    });
    if (!rows || rows.length === 0) throw new Error("회원가입 후 사용자 조회에 실패했습니다.");

    const user = rows[0];
    await createUserProfile(user.uuid, name, gender, birthdate, paradoxFlag, null, connection);
    await connection.commit();
    return user;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { signUpUser };
