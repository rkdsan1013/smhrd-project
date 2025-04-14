const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const verifyToken = require("../middlewares/verifyToken");

const validateVoteInput = (req, res, next) => {
  const { group_uuid, location, startDate, endDate, voteDeadline } = req.body;
  if (!group_uuid || !location || !startDate || !endDate || !voteDeadline) {
    return res.status(400).json({ success: false, message: "필수 필드가 누락되었습니다." });
  }
  next();
};

const validateParticipationInput = (req, res, next) => {
  const { voteUuid, participate } = req.body;
  if (!voteUuid || participate === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "voteUuid와 participate 필드가 필요합니다." });
  }
  next();
};

// GET /api/votes?group_uuid=...
// 그룹 내 투표 목록 조회
router.get("/", verifyToken, (req, res, next) => {
  const groupUuid = req.query.group_uuid;
  console.log(`GET /api/votes called by user ${req.user.uuid}, group_uuid: ${groupUuid}`);
  if (!groupUuid) {
    return res.status(400).json({ success: false, message: "group_uuid가 필요합니다." });
  }
  // 컨트롤러에 groupUuid를 명시적으로 전달
  req.queryGroupUuid = groupUuid;
  voteController.getTravelVotes(req, res, next);
});

// POST /api/votes
// 새 투표 생성
router.post("/", verifyToken, validateVoteInput, (req, res, next) => {
  const { group_uuid } = req.body;
  console.log(
    `POST /api/votes called by user ${
      req.user.uuid
    }, group_uuid: ${group_uuid}, body: ${JSON.stringify(req.body)}`,
  );
  // 컨트롤러에 groupUuid를 명시적으로 전달
  req.bodyGroupUuid = group_uuid;
  voteController.createTravelVote(req, res, next);
});

// POST /api/votes/:voteUuid/participate
// 투표 참여/취소
router.post("/:voteUuid/participate", verifyToken, validateParticipationInput, (req, res, next) => {
  const { voteUuid } = req.params;
  const { participate } = req.body;
  console.log(
    `POST /api/votes/${voteUuid}/participate called by user ${req.user.uuid}, participate: ${participate}`,
  );
  voteController.participateInTravelVote(req, res, next);
});

module.exports = router;
