const pool = require("../config/db");

// 친구 uuid 목록 조회 (일반)
const getAcceptedFriendUuids = async (uuid) => {
  const sql = `
    SELECT friend_uuid AS uuid
    FROM friends
    WHERE user_uuid = :uuid AND status = 'accepted'
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows;
};

// ✅ 소켓용 친구 uuid 목록 조회 (양방향 모두 포함)
const getAcceptedFriendUuidsForSocket = async (uuid) => {
  const sql = `
    SELECT 
      CASE
        WHEN user_uuid = :uuid THEN friend_uuid
        ELSE user_uuid
      END AS uuid
    FROM friends
    WHERE (user_uuid = :uuid OR friend_uuid = :uuid)
      AND status = 'accepted'
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows; // [{ uuid: '친구1' }, { uuid: '친구2' }]
};

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

const createFriendRequest = async (userUuid, targetUuid) => {
  const sql = `
    INSERT INTO friends (user_uuid, friend_uuid, status)
    VALUES (:userUuid, :targetUuid, 'pending')
  `;
  const [result] = await pool.query(sql, { userUuid, targetUuid });
  return result;
};

const acceptFriendRequest = async (receiverUuid, requesterUuid) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT * FROM friends 
       WHERE user_uuid = ? AND friend_uuid = ? AND status = 'pending'`,
      [requesterUuid, receiverUuid],
    );

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `UPDATE friends SET status = 'accepted' 
       WHERE user_uuid = ? AND friend_uuid = ?`,
      [requesterUuid, receiverUuid],
    );

    await connection.query(
      `INSERT IGNORE INTO friends (user_uuid, friend_uuid, status)
       VALUES (?, ?, 'accepted')`,
      [receiverUuid, requesterUuid],
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const declineFriendRequest = async (receiverUuid, requesterUuid) => {
  const sql = `
    DELETE FROM friends 
    WHERE user_uuid = ? AND friend_uuid = ? AND status = 'pending'
  `;
  const [result] = await pool.query(sql, [requesterUuid, receiverUuid]);
  return result.affectedRows > 0;
};

const getReceivedFriendRequests = async (receiverUuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
    FROM friends f
    JOIN users u ON f.user_uuid = u.uuid
    LEFT JOIN user_profiles up ON u.uuid = up.uuid
    WHERE f.friend_uuid = :receiverUuid AND f.status = 'pending'
  `;
  const [rows] = await pool.query(sql, { receiverUuid });
  return rows.map((profile) => {
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    if (profile.profilePicture) {
      profile.profilePicture = serverUrl + profile.profilePicture;
    }
    return profile;
  });
};

const getUserProfileByUuid = async (uuid) => {
  const sql = `
    SELECT u.uuid, u.email, up.name, up.profile_picture AS profilePicture
    FROM users u
    LEFT JOIN user_profiles up ON u.uuid = up.uuid
    WHERE u.uuid = :uuid
  `;
  const [rows] = await pool.query(sql, { uuid });
  return rows[0];
};

const deleteFriend = async (userUuid, targetUuid) => {
  const sql = `
    DELETE FROM friends 
    WHERE (user_uuid = :userUuid AND friend_uuid = :targetUuid)
       OR (user_uuid = :targetUuid AND friend_uuid = :userUuid)
  `;
  const [result] = await pool.query(sql, { userUuid, targetUuid });
  return result.affectedRows > 0;
};

module.exports = {
  getAcceptedFriendUuids,
  getAcceptedFriendUuidsForSocket, // ✅ socket.js에서 사용
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
