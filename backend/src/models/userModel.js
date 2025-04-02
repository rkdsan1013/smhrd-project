// /backend/src/models/userModel.js
const {
  getUserByEmail,
  getUserByUuid,
  updateUserProfilePicture,
  updateUserProfile,
  getProfileByUuid,
  changeUserPassword,
  deleteUserByUuid,
} = require("./userQueries");

const { signUpUser } = require("./userTransactions");

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
