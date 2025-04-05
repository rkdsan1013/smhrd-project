const {
  getAcceptedFriendUuids,
  getAcceptedFriendUuidsForSocket, // ✅ 온라인 상태 전파용
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getReceivedFriendRequests,
  getUserProfileByUuid,
  deleteFriend,
  cancelFriendRequest, // 추가됨
} = require("./friendQueries");

module.exports = {
  getAcceptedFriendUuids,
  getAcceptedFriendUuidsForSocket, // ✅ socket.js에서 사용됨
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getReceivedFriendRequests,
  getUserProfileByUuid,
  deleteFriend,
  cancelFriendRequest, // 친구 요청 취소 함수 추가
};
