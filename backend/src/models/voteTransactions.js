// /backend/src/models/voteTransactions.js
const voteQueries = require("./voteQueries");

const createTravelVote = async (
  dbPool,
  groupUuid,
  creatorUuid,
  location,
  startDate,
  endDate,
  headcount,
  description,
  voteDeadline,
) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(voteQueries.INSERT_TRAVEL_VOTE, [
      groupUuid,
      creatorUuid,
      location,
      startDate,
      endDate,
      headcount,
      description,
      voteDeadline,
    ]);

    const [rows] = await connection.query(voteQueries.SELECT_LATEST_TRAVEL_VOTE_BY_CREATOR, [
      creatorUuid,
      groupUuid,
    ]);
    if (!rows || rows.length === 0) {
      throw new Error("투표 생성 후 조회에 실패했습니다.");
    }
    const vote = rows[0];

    await connection.commit();
    return vote;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createTravelVote,
};
