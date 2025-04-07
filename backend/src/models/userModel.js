// /backend/src/models/userModel.js

const pool = require("../config/db");
const userQueries = require("./userQueries");
const userTransactions = require("./userTransactions");

// 이메일로 사용자 조회
const getUserByEmail = async (email) => {
  const [rows] = await pool.query(userQueries.SELECT_USER_BY_EMAIL, [email]);
  return rows[0];
};

// UUID로 사용자 조회
const getUserByUuid = async (uuid) => {
  const [rows] = await pool.query(userQueries.SELECT_USER_BY_UUID, [uuid]);
  return rows[0];
};

// 사용자 비밀번호 변경 (users 테이블)
const changeUserPassword = async (uuid, newPassword) => {
  const [result] = await pool.query(userQueries.UPDATE_USER_PASSWORD, [newPassword, uuid]);
  return result;
};

// UUID로 사용자 삭제
const deleteUserByUuid = async (uuid) => {
  const [result] = await pool.query(userQueries.DELETE_USER_BY_UUID, [uuid]);
  return result;
};

// UUID로 사용자 프로필 조회 (users와 user_profiles 조인)
const getProfileByUuid = async (uuid) => {
  const [rows] = await pool.query(userQueries.SELECT_PROFILE_BY_UUID, [uuid]);
  return rows[0];
};

// 사용자 프로필 사진 업데이트
const updateUserProfilePicture = async (uuid, profilePicture) => {
  const [result] = await pool.query(userQueries.UPDATE_USER_PROFILE_PICTURE, [
    profilePicture,
    uuid,
  ]);
  return result;
};

// 사용자 프로필 업데이트 (동적 필드 업데이트)
const updateUserProfile = async (uuid, updateData) => {
  return await userQueries.updateUserProfile(pool, uuid, updateData);
};

// 회원가입 트랜잭션 (pool 객체를 주입하여 처리)
const signUpUser = async (email, hashedPassword, name, gender, birthdate, paradoxFlag) => {
  return await userTransactions.signUpUser(
    pool,
    email,
    hashedPassword,
    name,
    gender,
    birthdate,
    paradoxFlag,
  );
};

// 🔹 상대방 프로필 + 친구 상태 포함 조회
const getProfileWithFriendStatus = async (currentUuid, targetUuid) => {
  const [rows] = await pool.query(userQueries.SELECT_PROFILE_WITH_FRIEND_STATUS, [
    currentUuid,
    targetUuid,
    targetUuid,
    currentUuid,
    targetUuid,
  ]);
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
  signUpUser,
  getProfileWithFriendStatus,
};
