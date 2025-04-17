// /backend/src/models/matchingQueries.js

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

exports.getRecommendedGroups = async (user_uuid) => {
  try {
    // user_uuid 인자가 객체이면 실제 uuid 값을 추출
    const userId = typeof user_uuid === "object" ? user_uuid.uuid : user_uuid;
    console.log("쿼리 시작: 사용자 ID", userId);

    // 1. 사용자의 최신 여행 설문 응답 조회 (created_at 컬럼이 없으므로 uuid 내림차순으로 정렬)
    const userSurveyQuery = `
      SELECT activity_type, budget_type, trip_duration
      FROM user_travel_surveys
      WHERE user_uuid = ?
      ORDER BY uuid DESC
      LIMIT 1
    `;
    const userSurveyResult = await db.query(userSurveyQuery, [userId]);

    // 2. 사용자의 설문 응답이 없는 경우, 공개 그룹 중 최신 생성된 그룹 5개를 fallback으로 반환
    if (userSurveyResult[0].length === 0) {
      console.log("사용자 설문 응답 없음, 기본 추천 진행");
      const fallbackQuery = `
        SELECT 
          gi.uuid,
          gi.name,
          gi.description,
          gi.group_icon,
          gi.group_picture,
          gi.group_leader_uuid
        FROM group_info gi
        WHERE gi.visibility = 'public'
        ORDER BY gi.created_at DESC
        LIMIT 5
      `;
      const fallbackResult = await db.query(fallbackQuery);
      console.log("기본 추천 그룹 개수:", fallbackResult[0].length);
      return fallbackResult;
    }

    // 3. 사용자의 최신 설문 응답을 기준으로 그룹 설문 데이터와의 유사도 계산
    const userSurvey = userSurveyResult[0][0];
    const { activity_type, budget_type, trip_duration } = userSurvey;

    const query = `
      SELECT 
        gi.uuid,
        gi.name,
        gi.description,
        gi.group_icon,
        gi.group_picture,
        gi.group_leader_uuid,
        COALESCE(
          (CASE WHEN gs.activity_type = ? THEN 1 ELSE 0 END) +
          (CASE WHEN gs.budget_type = ? THEN 1 ELSE 0 END) +
          (CASE WHEN gs.trip_duration = ? THEN 1 ELSE 0 END),
          0
        ) AS similarity_score
      FROM group_info gi
      LEFT JOIN group_surveys gs ON gs.group_uuid = gi.uuid
      WHERE gi.visibility = 'public'
      ORDER BY similarity_score DESC, gi.created_at DESC
      LIMIT 5
    `;
    const result = await db.query(query, [activity_type, budget_type, trip_duration]);
    console.log("추천 그룹 쿼리 결과 개수:", result[0].length);
    return result;
  } catch (error) {
    console.error("쿼리 실행 중 오류 발생:", error);
    return [[]];
  }
};
