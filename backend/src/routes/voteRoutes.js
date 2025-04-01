// /backend/src/routes/voteRoutes.js
const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/", verifyToken, voteController.createVote); // 투표 생성
router.get("/info/:uuid", verifyToken, voteController.getVote); // 투표 조회
router.post("/vote/:uuid", verifyToken, voteController.voteMulti); // MULTI 투표 참여
router.post("/participate/:uuid", verifyToken, voteController.participateSimple); // SIMPLE 투표 참여

module.exports = router;
