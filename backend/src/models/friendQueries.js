// /backend/src/models/friendQueries.js

// 친구 관련 SQL 쿼리들을 상수로 정의 (파라메터는 positional placeholder 사용)

// 특정 사용자의 친구 목록(요청 보낸 관점) 조회
const GET_ACCEPTED_FRIEND_UUIDS = `
  SELECT friend_uuid AS uuid
  FROM friends
  WHERE user_uuid = ? AND status = 'accepted'
`;

// 소켓용 친구 목록 조회 (양방향: user_uuid 또는 friend_uuid 모두 체크)
const GET_ACCEPTED_FRIEND_UUIDS_FOR_SOCKET = `
  SELECT 
    CASE
      WHEN user_uuid = ? THEN friend_uuid
      ELSE user_uuid
    END AS uuid
  FROM friends
  WHERE (user_uuid = ? OR friend_uuid = ?) AND status = 'accepted'
`;

// 사용자 프로필 조회 (users와 user_profiles 조인)
const GET_FRIEND_PROFILE_BY_UUID = `
  SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  WHERE u.uuid = ?
`;

// 사용자 검색: 이메일 또는 이름에 keyword 포함하면서, 본인 제외한 정보 및 친구 요청 상태 포함
const SEARCH_USERS_BY_KEYWORD = `
  SELECT 
    u.uuid,
    u.email,
    up.name,
    up.profile_picture AS profilePicture,
    f.status AS friendStatus
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  LEFT JOIN friends f ON f.friend_uuid = u.uuid AND f.user_uuid = ?
  WHERE (u.email LIKE ? OR up.name LIKE ?)
    AND u.uuid != ?
  ORDER BY up.name ASC
  LIMIT 20
`;

// 두 사용자 간의 친구 상태 확인 쿼리
const CHECK_FRIEND_STATUS = `
  SELECT *
  FROM friends
  WHERE (user_uuid = ? AND friend_uuid = ?)
     OR (user_uuid = ? AND friend_uuid = ?)
  LIMIT 1
`;

// 친구 요청 생성 쿼리 (pending 상태)
const CREATE_FRIEND_REQUEST = `
  INSERT INTO friends (user_uuid, friend_uuid, status)
  VALUES (?, ?, 'pending')
`;

// 친구 요청 거절(삭제): pending 상태인 요청 삭제
const DECLINE_FRIEND_REQUEST = `
  DELETE FROM friends
  WHERE user_uuid = ? AND friend_uuid = ? AND status = 'pending'
`;

// 받은 친구 요청 조회 (JOIN을 통해 요청자의 정보와 프로필 포함)
const GET_RECEIVED_FRIEND_REQUESTS = `
  SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
  FROM friends f
  JOIN users u ON f.user_uuid = u.uuid
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  WHERE f.friend_uuid = ? AND f.status = 'pending'
`;

// 친구 삭제 쿼리 (양쪽 관계 모두 삭제)
const DELETE_FRIEND = `
  DELETE FROM friends
  WHERE (user_uuid = ? AND friend_uuid = ?)
     OR (user_uuid = ? AND friend_uuid = ?)
`;

// 보낸 친구 요청 취소 쿼리 (pending 상태 삭제)
const CANCEL_FRIEND_REQUEST = `
  DELETE FROM friends
  WHERE user_uuid = ? AND friend_uuid = ? AND status = 'pending'
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
