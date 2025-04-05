// /backend/src/models/friendModel.js

const pool = require("../config/db");
const friendQueries = require("./friendQueries");
const friendTransactions = require("./friendTransactions");

// 특정 사용자의 친구 목록(요청 보낸 관점) 조회
const getAcceptedFriendUuids = async (userUuid) => {
  const [rows] = await pool.query(friendQueries.GET_ACCEPTED_FRIEND_UUIDS, [userUuid]);
  return rows;
};

// 소켓 통신용으로 양방향 친구 목록 조회 (현재 사용자가 friend_uuid 또는 user_uuid로 등장하는 경우 모두 포함)
const getAcceptedFriendUuidsForSocket = async (userUuid) => {
  // 쿼리의 ?는 순서대로: 첫번째: CASE 비교, 두번째/세번째: WHERE 절의 조건
  const [rows] = await pool.query(friendQueries.GET_ACCEPTED_FRIEND_UUIDS_FOR_SOCKET, [
    userUuid,
    userUuid,
    userUuid,
  ]);
  return rows; // 예: [{ uuid: '친구1' }, { uuid: '친구2' }]
};

// 사용자 프로필 정보 조회 (users와 user_profiles 조인)
const getFriendProfileByUuid = async (uuid) => {
  const [rows] = await pool.query(friendQueries.GET_FRIEND_PROFILE_BY_UUID, [uuid]);
  return rows[0];
};

// 이메일이나 이름을 기반으로 사용자 검색 (본인 제외, 친구 요청 상태 포함)
const searchUsersByKeyword = async (keyword, excludeUuid) => {
  const searchKeyword = `%${keyword}%`;
  const [rows] = await pool.query(friendQueries.SEARCH_USERS_BY_KEYWORD, [
    excludeUuid, // LEFT JOIN 조건에 사용
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
    targetUuid,
    userUuid,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

// 친구 요청 생성 (요청을 보내는 사용자와 받는 사용자 간의 pending 상태 INSERT)
const createFriendRequest = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.CREATE_FRIEND_REQUEST, [userUuid, targetUuid]);
  return result;
};

// 친구 요청 수락 (트랜잭션 사용)
// - 요청자가 보낸 pending 요청을 수락 처리하고, 양방향 관계를 형성
const acceptFriendRequest = async (receiverUuid, requesterUuid) => {
  return await friendTransactions.acceptFriendRequest(pool, receiverUuid, requesterUuid);
};

// 친구 요청 거절 (pending 상태인 요청 삭제)
const declineFriendRequest = async (receiverUuid, requesterUuid) => {
  const [result] = await pool.query(friendQueries.DECLINE_FRIEND_REQUEST, [
    requesterUuid,
    receiverUuid,
  ]);
  return result.affectedRows > 0;
};

// 받은 친구 요청 목록 조회 (JOIN을 통해 사용자 정보 포함)
// 프로필 사진이 있을 경우 서버 URL을 함께 붙여서 반환
const getReceivedFriendRequests = async (receiverUuid) => {
  const [rows] = await pool.query(friendQueries.GET_RECEIVED_FRIEND_REQUESTS, [receiverUuid]);
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  return rows.map((profile) => {
    if (profile.profilePicture) {
      profile.profilePicture = serverUrl + profile.profilePicture;
    }
    return profile;
  });
};

// UUID를 통해 사용자 프로필 조회 (친구 조회와 동일한 쿼리 사용)
const getUserProfileByUuid = async (uuid) => {
  const [rows] = await pool.query(friendQueries.GET_FRIEND_PROFILE_BY_UUID, [uuid]);
  return rows[0];
};

// 친구 삭제 (양쪽 모두에서 삭제 처리)
const deleteFriend = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.DELETE_FRIEND, [
    userUuid,
    targetUuid,
    targetUuid,
    userUuid,
  ]);
  return result.affectedRows > 0;
};

// 내가 보낸 친구 요청 취소 (pending 상태 삭제)
const cancelFriendRequest = async (userUuid, targetUuid) => {
  const [result] = await pool.query(friendQueries.CANCEL_FRIEND_REQUEST, [userUuid, targetUuid]);
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
