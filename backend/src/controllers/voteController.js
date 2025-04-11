// /backend/src/controllers/voteController.js
const voteModel = require("../models/voteModel");

const createTravelVote = async (req, res, next) => {
  try {
    const { groupUuid } = req.params;
    const creatorUuid = req.user.uuid; // verifyToken에서 설정된 req.user 사용
    const { location, startDate, endDate, headcount, description, voteDeadline } = req.body;

    // 필수 필드 검증
    if (!location || !startDate || !endDate || !voteDeadline) {
      return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
    }

    // 그룹 멤버 여부 확인
    const isMember = await voteModel.checkIsGroupMember(groupUuid, creatorUuid);
    if (!isMember) {
      return res.status(403).json({ message: "그룹 멤버만 투표를 생성할 수 있습니다." });
    }

    // 투표 생성
    const vote = await voteModel.createTravelVote(
      groupUuid,
      creatorUuid,
      location,
      startDate,
      endDate,
      headcount,
      description,
      voteDeadline,
    );

    res.status(201).json(vote);
  } catch (error) {
    next(error);
  }
};

const getTravelVotes = async (req, res, next) => {
  try {
    const { groupUuid } = req.params;
    const userUuid = req.user.uuid; // verifyToken에서 설정된 req.user 사용

    // 그룹 멤버 여부 확인
    const isMember = await voteModel.checkIsGroupMember(groupUuid, userUuid);
    if (!isMember) {
      return res.status(403).json({ message: "그룹 멤버만 투표를 조회할 수 있습니다." });
    }

    // 투표 목록 조회
    const votes = await voteModel.getTravelVotes(groupUuid, userUuid);
    console.log("Returning votes:", votes);
    res.status(200).json(votes);
  } catch (error) {
    next(error);
  }
};

const participateInTravelVote = async (req, res, next) => {
  try {
    const { voteUuid } = req.params;
    const { participate } = req.body;
    const userUuid = req.user.uuid; // verifyToken에서 설정된 req.user 사용

    // 투표 참여/취소 처리
    await voteModel.participateInTravelVote(voteUuid, userUuid, participate);
    res.status(200).json({
      message: participate ? "투표에 참여했습니다." : "투표 참여를 취소했습니다.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTravelVote,
  getTravelVotes,
  participateInTravelVote,
};
