// /backend/src/models/voteModel.js
const pool = require("../config/db");
const voteQueries = require("./voteQueries");
const voteTransactions = require("./voteTransactions");

const createTravelVote = async (
  groupUuid,
  creatorUuid,
  location,
  startDate,
  endDate,
  headcount,
  description,
  voteDeadline,
) => {
  return await voteTransactions.createTravelVote(
    pool,
    groupUuid,
    creatorUuid,
    location,
    startDate,
    endDate,
    headcount,
    description,
    voteDeadline,
  );
};

const getTravelVotes = async (groupUuid, userUuid) => {
  const [rows] = await pool.query(voteQueries.SELECT_TRAVEL_VOTES_BY_GROUP, [userUuid, groupUuid]);
  return rows;
};

const participateInTravelVote = async (voteUuid, userUuid, participate) => {
  if (participate) {
    await pool.query(voteQueries.INSERT_TRAVEL_VOTE_PARTICIPANT, [voteUuid, userUuid]);
  } else {
    await pool.query(voteQueries.DELETE_TRAVEL_VOTE_PARTICIPANT, [voteUuid, userUuid]);
  }
};

const checkIsGroupMember = async (groupUuid, userUuid) => {
  const [rows] = await pool.query(voteQueries.CHECK_IS_GROUP_MEMBER, [groupUuid, userUuid]);
  return rows.length > 0;
};

module.exports = {
  createTravelVote,
  getTravelVotes,
  participateInTravelVote,
  checkIsGroupMember,
};
