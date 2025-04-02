// /backend/src/models/userModel.js
const {
  getUserByEmail,
  updateUserProfilePicture,
  getProfileByUuid,
  getFriendsByUuid,
} = require("./userQueries");
const { signUpUser } = require("./userTransactions");

module.exports = {
  getUserByEmail,
  updateUserProfilePicture,
  signUpUser,
  getProfileByUuid,
  getFriendsByUuid,
};
