// /backend/src/models/userModel.js
const {
  getUserByEmail,
  updateUserProfilePicture,
  getProfileByUuid,
  getUserByUuid,
  updateUserProfile,
  changeUserPassword,
  deleteUserByUuid,
} = require("./userQueries");

const { signUpUser } = require("./userTransactions");

// 모듈로 함수들을 재export
module.exports = {
  getUserByEmail,
  getUserByUuid,
  updateUserProfilePicture,
  updateUserProfile,
  signUpUser,
  getProfileByUuid,
  changeUserPassword,
  deleteUserByUuid,
};
