// /backend/src/models/matchingModel.js

const matchingQueries = require("./matchingQueries");

exports.createMatching = async (user_uuid, location, trip_type, period) => {
  try {
    const [result] = await matchingQueries.insertMatching(user_uuid, location, trip_type, period);
    return { matching_uuid: result.insertId };
  } catch (err) {
    throw new Error("매칭 저장 실패");
  }
};

exports.getMatchingList = async (user_uuid) => {
  try {
    const [list] = await matchingQueries.selectRecommendedMatchings(user_uuid);
    return list;
  } catch (err) {
    throw new Error("추천 리스트 불러오기 실패");
  }
};

exports.acceptMatching = async (user_uuid, matching_uuid) => {
  try {
    const [result] = await matchingQueries.updateMatchingStatus(user_uuid, matching_uuid);
    return { success: result.affectedRows === 1 };
  } catch (err) {
    throw new Error("매칭 수락 처리 실패");
  }
};

// 단순화된 추천 그룹 조회
exports.getRecommendedGroups = async (user_uuid) => {
  console.log("모델 호출: 추천 그룹 조회", { user_uuid });

  try {
    // 쿼리 실행
    const result = await matchingQueries.getRecommendedGroups(user_uuid);

    // 안전한 구조 분해
    const groups = result[0] || [];

    console.log("모델 결과:", { groupsCount: groups.length });

    // 단순화된 객체 매핑
    return groups.map((g) => ({
      uuid: g.uuid || "",
      name: g.name || "이름 없는 그룹",
      description: g.description || "",
      group_icon: g.group_icon || null,
      group_picture: g.group_picture || null,
      group_leader_uuid: g.group_leader_uuid || "",
    }));
  } catch (err) {
    console.error("모델 처리 중 오류:", err);
    return [];
  }
};
