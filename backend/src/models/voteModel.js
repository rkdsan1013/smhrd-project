// /backend/src/models/voteModel.js

const pool = require("../config/db");
const voteQueries = require("./voteQueries");
const voteTransactions = require("./voteTransactions");

const createTravelVote = async (
  groupUuid,
  creatorUuid,
  title,
  location,
  startDate,
  endDate,
  headcount,
  description,
) => {
  console.log(`createTravelVote: Starting for group ${groupUuid}, creator ${creatorUuid}`);
  try {
    const vote = await voteTransactions.createTravelVote(
      pool,
      groupUuid,
      creatorUuid,
      title,
      location,
      startDate,
      endDate,
      headcount,
      description,
    );
    console.log(`createTravelVote: Successfully created vote ${vote.uuid}`);
    return vote;
  } catch (error) {
    console.error(`createTravelVote error: ${error.message}`);
    throw new Error(`투표 생성 실패: ${error.message}`);
  }
};

const getTravelVotes = async (groupUuid, userUuid) => {
  console.log(`getTravelVotes: Fetching votes for group ${groupUuid}, user ${userUuid}`);
  try {
    const [rows] = await pool.query(voteQueries.SELECT_TRAVEL_VOTES_BY_GROUP, [
      userUuid,
      groupUuid,
    ]);
    console.log(`getTravelVotes: Retrieved ${rows.length} votes`);
    return rows;
  } catch (error) {
    console.error(`getTravelVotes error: ${error.message}`);
    throw new Error(`투표 목록 조회 실패: ${error.message}`);
  }
};

const participateInTravelVote = async (voteUuid, userUuid, participate) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(
      `participateInTravelVote: ${
        participate ? "Joining" : "Cancelling"
      } vote ${voteUuid} for user ${userUuid}`,
    );

    const [[vote]] = await connection.query(
      `SELECT schedule_uuid, group_uuid FROM travel_votes WHERE uuid = ?`,
      [voteUuid],
    );
    if (!vote) {
      throw new Error("투표를 찾을 수 없습니다.");
    }
    const { schedule_uuid, group_uuid } = vote;

    if (participate) {
      const [[existing]] = await connection.query(
        `SELECT 1 FROM travel_vote_participants WHERE vote_uuid = ? AND user_uuid = ?`,
        [voteUuid, userUuid],
      );
      if (existing) {
        throw new Error("이미 투표에 참여한 사용자입니다.");
      }

      await connection.query(voteQueries.INSERT_TRAVEL_VOTE_PARTICIPANT, [voteUuid, userUuid]);

      if (schedule_uuid) {
        await connection.query(
          `INSERT IGNORE INTO schedule_members (schedule_uuid, user_uuid) VALUES (?, ?)`,
          [schedule_uuid, userUuid],
        );
      }
    } else {
      const [[existing]] = await connection.query(
        `SELECT 1 FROM travel_vote_participants WHERE vote_uuid = ? AND user_uuid = ?`,
        [voteUuid, userUuid],
      );
      if (!existing) {
        throw new Error("투표에 참여하지 않은 사용자입니다.");
      }

      await connection.query(voteQueries.DELETE_TRAVEL_VOTE_PARTICIPANT, [voteUuid, userUuid]);

      if (schedule_uuid) {
        await connection.query(
          `DELETE FROM schedule_members WHERE schedule_uuid = ? AND user_uuid = ?`,
          [schedule_uuid, userUuid],
        );
      }

      // 참여자 수 확인
      const [[{ count }]] = await connection.query(
        `SELECT COUNT(*) as count FROM travel_vote_participants WHERE vote_uuid = ?`,
        [voteUuid],
      );
      if (count === 0) {
        console.log(`[participateInTravelVote] No participants left, deleting vote ${voteUuid}`);
        await connection.query(`DELETE FROM travel_votes WHERE uuid = ?`, [voteUuid]);
        if (schedule_uuid) {
          await connection.query(`DELETE FROM schedules WHERE uuid = ?`, [schedule_uuid]);
          await connection.query(
            `DELETE FROM chat_rooms WHERE schedule_uuid = ? AND type = 'schedule'`,
            [schedule_uuid],
          );
        }
        // 소켓 이벤트: 투표 삭제 알림
        global.io.to(group_uuid).emit("travelVoteDeleted", { voteUuid, groupUuid });
      }
    }

    await connection.commit();
    console.log(
      `participateInTravelVote: ${
        participate ? "Joined" : "Cancelled"
      } vote ${voteUuid} for user ${userUuid}`,
    );
  } catch (error) {
    await connection.rollback();
    console.error(`participateInTravelVote error: ${error.message}`);
    throw new Error(`투표 ${participate ? "참여" : "취소"} 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

const checkIsGroupMember = async (groupUuid, userUuid) => {
  console.log(`checkIsGroupMember: Checking user ${userUuid} in group ${groupUuid}`);
  try {
    const [rows] = await pool.query(voteQueries.CHECK_IS_GROUP_MEMBER, [groupUuid, userUuid]);
    const isMember = rows.length > 0;
    console.log(
      `checkIsGroupMember: User ${userUuid} is ${
        isMember ? "" : "not "
      }member of group ${groupUuid}`,
    );
    return isMember;
  } catch (error) {
    console.error(`checkIsGroupMember error: ${error.message}`);
    throw new Error(`그룹 멤버 확인 실패: ${error.message}`);
  }
};

const getVoteById = async (voteUuid) => {
  console.log(`getVoteById: Fetching vote ${voteUuid}`);
  try {
    const [rows] = await pool.query(
      `SELECT group_uuid, schedule_uuid FROM travel_votes WHERE uuid = ?`,
      [voteUuid],
    );
    if (rows.length === 0) {
      return null;
    }
    console.log(`getVoteById: Found vote ${voteUuid}`);
    return rows[0];
  } catch (error) {
    console.error(`getVoteById error: ${error.message}`);
    throw new Error(`투표 조회 실패: ${error.message}`);
  }
};

const getParticipantCount = async (voteUuid) => {
  console.log(`getParticipantCount: Fetching count for vote ${voteUuid}`);
  try {
    const [[result]] = await pool.query(
      `SELECT COUNT(user_uuid) as participant_count FROM travel_vote_participants WHERE vote_uuid = ?`,
      [voteUuid],
    );
    console.log(`getParticipantCount: Count ${result.participant_count} for vote ${voteUuid}`);
    return result.participant_count;
  } catch (error) {
    console.error(`getParticipantCount error: ${error.message}`);
    throw new Error(`참여자 수 조회 실패: ${error.message}`);
  }
};

module.exports = {
  createTravelVote,
  getTravelVotes,
  participateInTravelVote,
  checkIsGroupMember,
  getVoteById,
  getParticipantCount,
};
