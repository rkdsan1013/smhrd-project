const voteModel = require("../models/voteModel");

const createTravelVote = async (req, res, next) => {
  try {
    const groupUuid = req.bodyGroupUuid;
    const creatorUuid = req.user.uuid;
    const { title, location, startDate, endDate, headcount, description, voteDeadline } = req.body;

    console.log(
      `createTravelVote: user ${creatorUuid} creating vote for group ${groupUuid}, title: ${title}`,
    );

    if (!location || !startDate || !endDate || !voteDeadline) {
      return res.status(400).json({
        success: false,
        message: "필수 필드(location, startDate, endDate, voteDeadline)가 누락되었습니다.",
      });
    }

    const isMember = await voteModel.checkIsGroupMember(groupUuid, creatorUuid);
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "그룹 멤버만 투표를 생성할 수 있습니다." });
    }

    const vote = await voteModel.createTravelVote(
      groupUuid,
      creatorUuid,
      title,
      location,
      startDate,
      endDate,
      headcount,
      description,
      voteDeadline,
    );

    global.io.to(groupUuid).emit("travelVoteCreated", {
      voteUuid: vote.uuid,
      groupUuid,
    });
    console.log(`travelVoteCreated emitted to group ${groupUuid}: vote ${vote.uuid}`);

    res.status(201).json({ success: true, vote });
  } catch (error) {
    console.error(`createTravelVote error for user ${req.user.uuid}: ${error.message}`);
    res.status(500).json({ success: false, message: `투표 생성 중 오류: ${error.message}` });
  }
};

const getTravelVotes = async (req, res, next) => {
  try {
    const groupUuid = req.queryGroupUuid;
    const userUuid = req.user.uuid;

    console.log(`getTravelVotes: user ${userUuid} fetching votes for group ${groupUuid}`);

    const isMember = await voteModel.checkIsGroupMember(groupUuid, userUuid);
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "그룹 멤버만 투표를 조회할 수 있습니다." });
    }

    const votes = await voteModel.getTravelVotes(groupUuid, userUuid);
    console.log(`getTravelVotes: returning ${votes.length} votes for group ${groupUuid}`);

    res.status(200).json({ success: true, votes });
  } catch (error) {
    console.error(`getTravelVotes error for user ${userUuid}: ${error.message}`);
    res.status(500).json({ success: false, message: `투표 조회 중 오류: ${error.message}` });
  }
};

const participateInTravelVote = async (req, res, next) => {
  try {
    const { voteUuid } = req.params;
    const { participate } = req.body;
    const userUuid = req.user.uuid;

    console.log(
      `participateInTravelVote: user ${userUuid} ${
        participate ? "joining" : "cancelling"
      } vote ${voteUuid}`,
    );

    // 투표 존재 여부 및 그룹 멤버 확인
    const vote = await voteModel.getVoteById(voteUuid); // 새 메서드 호출
    if (!vote) {
      return res.status(404).json({ success: false, message: "투표를 찾을 수 없습니다." });
    }
    const isMember = await voteModel.checkIsGroupMember(vote.group_uuid, userUuid);
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "그룹 멤버만 투표에 참여할 수 있습니다." });
    }

    // 투표 참여/취소 처리
    await voteModel.participateInTravelVote(voteUuid, userUuid, participate);

    // 참여자 수 조회
    const participant_count = await voteModel.getParticipantCount(voteUuid); // 새 메서드 호출

    // 소켓 이벤트
    global.io.to(vote.group_uuid).emit("voteParticipationUpdated", {
      voteUuid,
      participant_count,
      userUuid,
      participate,
    });
    console.log(
      `voteParticipationUpdated emitted to group ${vote.group_uuid}: vote ${voteUuid}, count ${participant_count}`,
    );

    res.status(200).json({
      success: true,
      message: participate ? "투표에 참여했습니다." : "투표 참여를 취소했습니다.",
    });
  } catch (error) {
    console.error(`participateInTravelVote error for user ${req.user.uuid}: ${error.message}`);
    res.status(500).json({ success: false, message: `투표 참여 처리 중 오류: ${error.message}` });
  }
};

module.exports = {
  createTravelVote,
  getTravelVotes,
  participateInTravelVote,
};
