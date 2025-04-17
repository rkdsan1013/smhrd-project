const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const matchingController = require("../controllers/matchingController");

const router = express.Router();

// 매칭된 그룹 추천 (유저 설문 기반)
router.get("/recommend", verifyToken, matchingController.getRecommendedGroups);

module.exports = router;