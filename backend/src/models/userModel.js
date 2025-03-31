// /backend/src/models/userModel.js
const { getUserByEmail, updateUserProfilePicture, getProfileByUuid, getFriendsByUuid } = require("./userQueries");
const { signUpUser } = require("./userTransactions");

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  signUpUser,
  getProfileByUuid,
  getFriendsByUuid, // 친구 목록 조회 함수 추가
};