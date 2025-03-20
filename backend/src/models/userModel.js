// /backend/src/models/userModel.js
const { getUserByEmail, updateUserProfilePicture } = require('./userQueries');
const { signUpUser } = require('./userTransactions');

module.exports = { getUserByEmail, updateUserProfilePicture, signUpUser };