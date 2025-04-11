// /backend/src/routes/voteRoutes.js
const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const verifyToken = require("../middlewares/verifyToken");

router.get("/:groupUuid", verifyToken, (req, res, next) => {
  console.log("GET /api/votes/:groupUuid called with:", req.params.groupUuid);
  voteController.getTravelVotes(req, res, next);
});

router.post("/:groupUuid", verifyToken, voteController.createTravelVote);
router.post("/:voteUuid/participate", verifyToken, voteController.participateInTravelVote);

module.exports = router;
