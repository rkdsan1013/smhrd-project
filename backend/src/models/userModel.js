// /backend/src/models/userModel.js
const {
  getUserByEmail,
  updateUserProfilePicture,
  updateUserProfile,
  getProfileByUuid,
} = require("./userQueries");

const { signUpUser } = require("./userTransactions");

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  updateUserProfile,
  signUpUser,
  getProfileByUuid,
};
