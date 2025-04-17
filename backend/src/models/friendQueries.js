// /backend/src/models/friendQueries.js
// 친구 관련 쿼리 모음
// 테이블: friendships (user1_uuid, user2_uuid, requester_uuid, status, created_at)
// 주의: 두 UUID는 LEAST/GREATEST를 사용하여 항상 정렬된 순서(즉, user1_uuid < user2_uuid)로 저장됨

// 특정 사용자의 수락된 친구 목록 조회
const GET_ACCEPTED_FRIEND_UUIDS = `
  SELECT 
    CASE WHEN user1_uuid = ? THEN user2_uuid ELSE user1_uuid END AS uuid
  FROM friendships
  WHERE (user1_uuid = ? OR user2_uuid = ?)
    AND status = 'accepted'
`;

// 소켓 통신용 수락된 친구 목록 조회 (위와 동일)
const GET_ACCEPTED_FRIEND_UUIDS_FOR_SOCKET = `
  SELECT 
    CASE WHEN user1_uuid = ? THEN user2_uuid ELSE user1_uuid END AS uuid
  FROM friendships
  WHERE (user1_uuid = ? OR user2_uuid = ?)
    AND status = 'accepted'
`;

// 사용자 프로필 조회 (users와 user_profiles 조인)
const GET_FRIEND_PROFILE_BY_UUID = `
  SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  WHERE u.uuid = ?
`;

// 이메일 또는 이름 기반 사용자 검색 (본인 제외, 친구 요청 상태 포함)
// JOIN을 통해 두 사용자 간의 친구 관계 존재 여부 확인 (정렬된 키 사용)
const SEARCH_USERS_BY_KEYWORD = `
  SELECT 
    u.uuid,
    u.email,
    up.name,
    up.profile_picture AS profilePicture,
    f.status AS friendStatus,
    f.requester_uuid AS friendRequester
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  LEFT JOIN friendships f 
    ON ( f.user1_uuid = LEAST(?, u.uuid) AND f.user2_uuid = GREATEST(?, u.uuid) )
  WHERE (u.email LIKE ? OR up.name LIKE ?)
    AND u.uuid != ?
  ORDER BY up.name ASC
  LIMIT 20
`;

// 두 사용자 간의 친구 상태 확인 (정렬된 순서로 비교)
const CHECK_FRIEND_STATUS = `
  SELECT *
  FROM friendships
  WHERE user1_uuid = LEAST(?, ?) AND user2_uuid = GREATEST(?, ?)
  LIMIT 1
`;

// 친구 요청 생성 (pending 상태)
// 첫 두 파라미터: 두 UUID (LEAST와 GREATEST로 정렬), 세 번째: 요청자 (요청 보낸 사용자)
const CREATE_FRIEND_REQUEST = `
  INSERT INTO friendships (user1_uuid, user2_uuid, requester_uuid, status)
  VALUES (LEAST(?, ?), GREATEST(?, ?), ?, 'pending')
`;

// 친구 요청 거절 (pending 상태인 요청 삭제)
// receiver: 요청 받은 사용자, requester: 친구 요청을 보낸 사용자
const DECLINE_FRIEND_REQUEST = `
  DELETE FROM friendships
  WHERE user1_uuid = LEAST(?, ?) AND user2_uuid = GREATEST(?, ?)
    AND status = 'pending'
    AND requester_uuid = ?
`;

// 받은 친구 요청 조회 (내게 온 요청: 내 UUID 포함, 요청자와 다름)
const GET_RECEIVED_FRIEND_REQUESTS = `
  SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
  FROM friendships f
  JOIN users u ON u.uuid = f.requester_uuid
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  WHERE (f.user1_uuid = ? OR f.user2_uuid = ?)
    AND f.status = 'pending'
    AND f.requester_uuid <> ?
`;

// 친구 삭제 (두 사용자 간의 친구 관계 삭제)
const DELETE_FRIEND = `
  DELETE FROM friendships
  WHERE user1_uuid = LEAST(?, ?) AND user2_uuid = GREATEST(?, ?)
`;

// 보낸 친구 요청 취소 (pending 상태 삭제; 요청자 본인)
const CANCEL_FRIEND_REQUEST = `
  DELETE FROM friendships
  WHERE user1_uuid = LEAST(?, ?) AND user2_uuid = GREATEST(?, ?)
    AND status = 'pending'
    AND requester_uuid = ?
`;

module.exports = {
  GET_ACCEPTED_FRIEND_UUIDS,
  GET_ACCEPTED_FRIEND_UUIDS_FOR_SOCKET,
  GET_FRIEND_PROFILE_BY_UUID,
  SEARCH_USERS_BY_KEYWORD,
  CHECK_FRIEND_STATUS,
  CREATE_FRIEND_REQUEST,
  DECLINE_FRIEND_REQUEST,
  GET_RECEIVED_FRIEND_REQUESTS,
  DELETE_FRIEND,
  CANCEL_FRIEND_REQUEST,
};
