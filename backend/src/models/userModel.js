// /backend/src/models/userModel.js
const { 
  getUserByEmail, 
  updateUserProfilePicture, 
  getUserProfileByUuid  // 추가  
} = require('./userQueries');
const { signUpUser } = require('./userTransactions');

module.exports = { 
  getUserByEmail, 
  updateUserProfilePicture, 
  signUpUser,
  getUserProfileByUuid
};