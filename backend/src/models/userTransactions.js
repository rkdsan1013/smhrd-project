// /backend/src/models/userTransactions.js

const userQueries = require("./userQueries");

// 회원가입 트랜잭션 (사용자 및 프로필 생성)
const signUpUser = async (dbPool, email, hashedPassword, name, gender, birthdate, paradoxFlag) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // USERS 테이블에 사용자 삽입
    await connection.query(userQueries.INSERT_USER, [email, hashedPassword]);

    // 삽입 후, 유일한 이메일 기준으로 유저 정보를 조회 (uuid 포함)
    const [rows] = await connection.query(userQueries.SELECT_USER_BY_EMAIL, [email]);
    if (!rows || rows.length === 0) throw new Error("회원가입 후 사용자 조회에 실패했습니다.");
    const user = rows[0];

    // USER_PROFILES 테이블에 프로필 생성 (프로필 사진은 초기에는 null)
    await connection.query(userQueries.INSERT_USER_PROFILE, [
      user.uuid,
      name,
      gender,
      birthdate,
      paradoxFlag,
      null,
    ]);
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
