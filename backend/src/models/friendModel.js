// /backend/src/models/friendModel.js

const pool = require("../config/db");
const friendQueries = require("./friendQueries");
const friendTransactions = require("./friendTransactions");

// 특정 사용자의 (수락된) 친구 목록 조회
const getAcceptedFriendUuids = async (userUuid) => {
  const [rows] = await pool.query(friendQueries.GET_ACCEPTED_FRIEND_UUIDS, [
    userUuid,
    userUuid,
    userUuid,
  ]);
  return rows;
};

// 소켓 통신용 친구 목록 조회
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

// 이메일이나 이름을 기반으로 사용자 검색 (본인 제외, 친구 요청 상태 포함)
const searchUsersByKeyword = async (keyword, excludeUuid) => {
  const searchKeyword = `%${keyword}%`;
  const [rows] = await pool.query(friendQueries.SEARCH_USERS_BY_KEYWORD, [
    excludeUuid, // 첫 번째 LEAST 파라미터
    excludeUuid, // 두 번째 GREATEST 파라미터
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

// 친구 요청 생성 (요청을 보낸 사용자가 대상에게 pending 상태의 친구 요청을 보냄)
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

// 친구 요청 수락 (트랜잭션을 사용하여 pending 상태를 accepted로 업데이트)
// 파라미터: receiverUuid(요청 받은 사용자), requesterUuid(친구 요청을 보낸 사용자)
const acceptFriendRequest = async (receiverUuid, requesterUuid) => {
  return await friendTransactions.acceptFriendRequest(pool, receiverUuid, requesterUuid);
};

// 친구 요청 거절 (pending 상태인 요청 삭제)
// 파라미터: receiverUuid(요청 받은 사용자), requesterUuid(친구 요청을 보낸 사용자)
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

// 받은 친구 요청 목록 조회 (내게 온 요청 조회: 내 UUID가 포함되고, 요청 보낸 사람이 나와 다름)
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

// UUID를 통해 사용자 프로필 조회 (친구 프로필 조회와 동일한 쿼리 사용)
const getUserProfileByUuid = async (uuid) => {
  const [rows] = await pool.query(friendQueries.GET_FRIEND_PROFILE_BY_UUID, [uuid]);
  return rows[0];
};

// 친구 삭제 (두 사용자 간의 친구 관계 삭제)
const deleteFriend = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.DELETE_FRIEND, [
    userUuid,
    targetUuid,
    userUuid,
    targetUuid,
  ]);
  return result.affectedRows > 0;
};

// 내가 보낸 친구 요청 취소 (pending 상태 삭제; 요청자 본인인 경우)
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
  getUserProfileByUuid,
  deleteFriend,
  cancelFriendRequest,
};
