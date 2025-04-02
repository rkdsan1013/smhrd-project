const pool = require("../config/db");

// 친구 uuid 목록 조회
const getAcceptedFriendUuids = async (uuid) => {
  const sql = `
    SELECT friend_uuid AS uuid
    FROM friends
    WHERE user_uuid = :uuid AND status = 'accepted'
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows;
};

// 친구 프로필 조회
const getFriendProfileByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

// 친구 추가 프로필 검색 (요청 상태 포함)
const searchUsersByKeyword = async (keyword, excludeUuid) => {
  const sql = `
      SELECT 
        u.uuid,
        u.email,
        up.name,
        up.profile_picture AS profilePicture,
        f.status AS friendStatus
      FROM users u
      LEFT JOIN user_profiles up ON u.uuid = up.uuid
      LEFT JOIN friends f
        ON f.friend_uuid = u.uuid AND f.user_uuid = :excludeUuid
      WHERE (u.email LIKE :kw OR up.name LIKE :kw)
        AND u.uuid != :excludeUuid
      ORDER BY up.name ASC
      LIMIT 20
    `;
  const [rows] = await pool.query(sql, {
    kw: `%${keyword}%`,
    excludeUuid,
  });
  return rows;
};

// 친구 관계 중복 확인
const checkFriendStatus = async (userUuid, targetUuid) => {
  const sql = `
      SELECT * FROM friends 
      WHERE (user_uuid = :userUuid AND friend_uuid = :targetUuid)
         OR (user_uuid = :targetUuid AND friend_uuid = :userUuid)
      LIMIT 1
    `;
  const [rows] = await pool.query(sql, { userUuid, targetUuid });
  return rows.length > 0 ? rows[0] : null;
};

// 친구 요청 생성
const createFriendRequest = async (userUuid, targetUuid) => {
  const sql = `
      INSERT INTO friends (user_uuid, friend_uuid, status)
      VALUES (:userUuid, :targetUuid, 'pending')
    `;
  const [result] = await pool.query(sql, { userUuid, targetUuid });
  return result;
};

module.exports = {
  getAcceptedFriendUuids,
  getFriendProfileByUuid,
  searchUsersByKeyword,
  checkFriendStatus,
  createFriendRequest,
};
