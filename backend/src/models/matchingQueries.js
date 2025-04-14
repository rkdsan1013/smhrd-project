const db = require("../config/db");

exports.insertMatching = async (user_uuid, location, trip_type, period) => {
  const query = `
    INSERT INTO travel_matchings (uuid, user_uuid, location, trip_type, period)
    VALUES (UUID(), ?, ?, ?, ?)
  `;
  const values = [user_uuid, location, trip_type, period];
  return await db.query(query, values);
};

exports.selectRecommendedMatchings = async (user_uuid) => {
  const query = `
    SELECT * FROM travel_matchings
    WHERE user_uuid != ?
    ORDER BY created_at DESC
    LIMIT 10
  `;
  return await db.query(query, [user_uuid]);
};

exports.updateMatchingStatus = async (user_uuid, matching_uuid) => {
  const query = `
    UPDATE travel_matchings
    SET status = 'accepted', accepted_by = ?
    WHERE uuid = ? AND status = 'pending'
  `;
  return await db.query(query, [user_uuid, matching_uuid]);
};

// 단순화: 기본 그룹 조회로 되돌림
exports.getRecommendedGroups = async (user_uuid) => {
  try {
    console.log("쿼리 시작: 사용자 ID", user_uuid);
    
    // 기본 그룹 조회 쿼리
    const query = `
      SELECT 
        gi.uuid,
        gi.name,
        gi.description,
        gi.group_icon,
        gi.group_picture,
        gi.group_leader_uuid
      FROM 
        group_info gi
      ORDER BY 
        gi.created_at DESC
      LIMIT 5
    `;
    
    const result = await db.query(query);
    console.log("쿼리 결과 개수:", result[0].length);
    return result;
    
  } catch (error) {
    console.error("쿼리 실행 중 오류 발생:", error);
    return [[]];
  }
};