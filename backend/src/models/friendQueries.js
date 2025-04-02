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

// 친구 추가 프로필 검색
const searchUsersByKeyword = async (keyword, excludeUuid) => {
  const sql = `
      SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
      FROM users u
      LEFT JOIN user_profiles up ON u.uuid = up.uuid
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

module.exports = {
  getAcceptedFriendUuids,
  getFriendProfileByUuid,
  searchUsersByKeyword,
};
