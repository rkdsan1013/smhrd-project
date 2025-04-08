// /backend/src/models/friendModel.js

const pool = require("../config/db");
const friendQueries = require("./friendQueries");
const friendTransactions = require("./friendTransactions");

// 특정 사용자의 수락된 친구 목록 조회
const getAcceptedFriendUuids = async (userUuid) => {
  const [rows] = await pool.query(friendQueries.GET_ACCEPTED_FRIEND_UUIDS, [
    userUuid,
    userUuid,
    userUuid,
  ]);
  return rows;
};

// 소켓 통신용 수락된 친구 목록 조회
const getAcceptedFriendUuidsForSocket = async (userUuid) => {
  const [rows] = await pool.query(friendQueries.GET_ACCEPTED_FRIEND_UUIDS_FOR_SOCKET, [
    userUuid,
    userUuid,
    userUuid,
  ]);
  return rows; // 예: [{ uuid: '친구1' }, { uuid: '친구2' }]
};

// 사용자 프로필 조회 (users와 user_profiles 조인)
const getFriendProfileByUuid = async (uuid) => {
  const [rows] = await pool.query(friendQueries.GET_FRIEND_PROFILE_BY_UUID, [uuid]);
  return rows[0];
};

// 이메일이나 이름 기반 사용자 검색 (본인 제외, 요청 상태 포함)
const searchUsersByKeyword = async (keyword, excludeUuid) => {
  const searchKeyword = `%${keyword}%`;
  const [rows] = await pool.query(friendQueries.SEARCH_USERS_BY_KEYWORD, [
    excludeUuid,
    excludeUuid,
    searchKeyword,
    searchKeyword,
    excludeUuid,
  ]);
  return rows;
};

// 두 사용자 간의 친구 상태 조회
const checkFriendStatus = async (userUuid, targetUuid) => {
  const [rows] = await pool.query(friendQueries.CHECK_FRIEND_STATUS, [
    userUuid,
    targetUuid,
    userUuid,
    targetUuid,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

// 친구 요청 생성 (pending 상태)
const createFriendRequest = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.CREATE_FRIEND_REQUEST, [
    userUuid,
    targetUuid,
    userUuid,
    targetUuid,
    userUuid,
  ]);
  return result;
};

// 친구 요청 수락 (pending -> accepted, 트랜잭션 사용)
const acceptFriendRequest = async (receiverUuid, requesterUuid) => {
  return await friendTransactions.acceptFriendRequest(pool, receiverUuid, requesterUuid);
};

// 친구 요청 거절 (pending 상태 삭제)
const declineFriendRequest = async (receiverUuid, requesterUuid) => {
  const [result] = await pool.query(friendQueries.DECLINE_FRIEND_REQUEST, [
    receiverUuid,
    requesterUuid,
    receiverUuid,
    requesterUuid,
    requesterUuid,
  ]);
  return result.affectedRows > 0;
};

// 받은 친구 요청 목록 조회 (내게 온 요청)
const getReceivedFriendRequests = async (receiverUuid) => {
  const [rows] = await pool.query(friendQueries.GET_RECEIVED_FRIEND_REQUESTS, [
    receiverUuid,
    receiverUuid,
    receiverUuid,
  ]);
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  return rows.map((profile) => {
    if (profile.profilePicture) {
      profile.profilePicture = serverUrl + profile.profilePicture;
    }
    return profile;
  });
};

// 친구 삭제 (두 사용자 간 관계 삭제)
const deleteFriend = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.DELETE_FRIEND, [
    userUuid,
    targetUuid,
    userUuid,
    targetUuid,
  ]);
  return result.affectedRows > 0;
};

// 내가 보낸 친구 요청 취소 (요청자 본인)
const cancelFriendRequest = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.CANCEL_FRIEND_REQUEST, [
    userUuid,
    targetUuid,
    userUuid,
    targetUuid,
    userUuid,
  ]);
  return result.affectedRows > 0;
};

module.exports = {
  getAcceptedFriendUuids,
  getAcceptedFriendUuidsForSocket,
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getReceivedFriendRequests,
  deleteFriend,
  cancelFriendRequest,
};
