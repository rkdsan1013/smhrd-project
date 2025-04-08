// /backend/src/models/userQueries.js
// 사용자 관련 SQL 쿼리 모음

// 사용자 INSERT 쿼리
const INSERT_USER = "INSERT INTO users (email, password) VALUES (?, ?)";

// 사용자 프로필 INSERT 쿼리
const INSERT_USER_PROFILE = `
  INSERT INTO user_profiles (uuid, name, gender, birthdate, paradox_flag, profile_picture)
  VALUES (?, ?, ?, ?, ?, ?)
`;

// 사용자 조회 쿼리들
const SELECT_USER_BY_EMAIL = "SELECT uuid, email, password FROM users WHERE email = ?";
const SELECT_USER_BY_UUID = "SELECT uuid, email, password FROM users WHERE uuid = ?";

// 사용자 관련 UPDATE/DELETE 쿼리들
const UPDATE_USER_PASSWORD = "UPDATE users SET password = ? WHERE uuid = ?";
const DELETE_USER_BY_UUID = "DELETE FROM users WHERE uuid = ?";

// 프로필 조회 쿼리
const SELECT_PROFILE_BY_UUID = `
  SELECT u.uuid, u.email, up.name, up.gender, up.birthdate,
         up.paradox_flag AS paradoxFlag, up.profile_picture AS profilePicture
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  WHERE u.uuid = ?
`;

// 프로필 사진 업데이트 쿼리
const UPDATE_USER_PROFILE_PICTURE = "UPDATE user_profiles SET profile_picture = ? WHERE uuid = ?";

// 친구 상태 포함된 프로필 조회 쿼리
const SELECT_PROFILE_WITH_FRIEND_STATUS = `
  SELECT 
    u.uuid,
    u.email,
    up.name,
    up.profile_picture AS profilePicture,
    fs.status AS friendStatus,
    fs.requester_uuid AS friendRequester
  FROM users u
  LEFT JOIN user_profiles up ON u.uuid = up.uuid
  LEFT JOIN friendships fs
    ON (
      (fs.user1_uuid = ? AND fs.user2_uuid = ?) OR
      (fs.user1_uuid = ? AND fs.user2_uuid = ?)
    )
  WHERE u.uuid = ?
`;

// 동적으로 업데이트할 필드를 구성하는 함수
const updateUserProfile = async (dbPool, uuid, updateData) => {
  let fields = [];
  let params = [];

  if (typeof updateData.name !== "undefined") {
    fields.push("name = ?");
    params.push(updateData.name);
  }
  if (Object.prototype.hasOwnProperty.call(updateData, "profilePicture")) {
    fields.push("profile_picture = ?");
    params.push(updateData.profilePicture);
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE user_profiles SET ${fields.join(", ")} WHERE uuid = ?`;
  params.push(uuid);
  const [result] = await dbPool.query(sql, params);

  if (result.affectedRows === 0) return null;
  const [rows] = await dbPool.query("SELECT * FROM user_profiles WHERE uuid = ?", [uuid]);
  return rows[0];
};

module.exports = {
  INSERT_USER,
  INSERT_USER_PROFILE,
  SELECT_USER_BY_EMAIL,
  SELECT_USER_BY_UUID,
  UPDATE_USER_PASSWORD,
  DELETE_USER_BY_UUID,
  SELECT_PROFILE_BY_UUID,
  UPDATE_USER_PROFILE_PICTURE,
  updateUserProfile,
  SELECT_PROFILE_WITH_FRIEND_STATUS,
};
