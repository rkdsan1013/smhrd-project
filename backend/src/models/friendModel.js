//src/models/friendModel.js
const {
  getAcceptedFriendUuids,
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getReceivedFriendRequests,
  getUserProfileByUuid,
  deleteFriend,
} = require("./friendQueries");

module.exports = {
  getAcceptedFriendUuids,
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getReceivedFriendRequests,
  getUserProfileByUuid,
  deleteFriend,
};
