// /backend/src/controllers/matchingController.js

const matchingModel = require("../models/matchingModel");

const createMatching = async (req, res) => {
  try {
    const user_uuid = req.user;
    const { location, trip_type, period } = req.body;

    const result = await matchingModel.createMatching(user_uuid, location, trip_type, period);
    res.status(201).json({ success: true, matching_uuid: result.matching_uuid });
  } catch (err) {
    console.error("매칭 생성 오류:", err.message);
    res.status(500).json({ success: false, message: "매칭 생성 실패" });
  }
};

const getMatchingList = async (req, res) => {
  try {
    const user_uuid = req.user;
    const result = await matchingModel.getMatchingList(user_uuid);
    res.status(200).json(result);
  } catch (err) {
    console.error("추천 리스트 오류:", err.message);
    res.status(500).json({ message: "추천 리스트 조회 실패" });
  }
};

const acceptMatching = async (req, res) => {
  try {
    const { matching_uuid } = req.params;
    const user_uuid = req.user;

    const result = await matchingModel.acceptMatching(user_uuid, matching_uuid);
    res.status(200).json(result);
  } catch (err) {
    console.error("매칭 수락 오류:", err.message);
    res.status(500).json({ message: "매칭 수락 실패" });
  }
};

// 단순화된 추천 그룹 컨트롤러
const getRecommendedGroups = async (req, res) => {
  console.log("컨트롤러 호출: 추천 그룹 조회");

  try {
    // 추가 로그: 사용자 ID 확인
    console.log("사용자 ID:", req.user);

    // 모델 호출
    const groups = await matchingModel.getRecommendedGroups(req.user);

    // 응답 확인 로그
    console.log(`추천 그룹 ${groups.length}개 응답`);

    // 정상 응답
    return res.status(200).json(groups);
  } catch (err) {
    console.error("추천 그룹 컨트롤러 오류:", err);
    return res.status(500).json({ message: "추천 그룹 조회 실패" });
  }
};

module.exports = {
  createMatching,
  getMatchingList,
  acceptMatching,
  getRecommendedGroups,
};
