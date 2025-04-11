// /backend/src/models/voteQueries.js
const INSERT_TRAVEL_VOTE = `
  INSERT INTO travel_votes (
    group_uuid, creator_uuid, location, start_date, end_date,
    headcount, description, vote_deadline
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const SELECT_LATEST_TRAVEL_VOTE_BY_CREATOR = `
  SELECT * FROM travel_votes
  WHERE creator_uuid = ? AND group_uuid = ?
  ORDER BY created_at DESC
  LIMIT 1
`;

const SELECT_TRAVEL_VOTES_BY_GROUP = `
  SELECT 
    tv.*,
    COUNT(tvp.user_uuid) AS participant_count,
    EXISTS (
      SELECT 1 FROM travel_vote_participants tvp2
      WHERE tvp2.vote_uuid = tv.uuid AND tvp2.user_uuid = ?
    ) AS has_participated
  FROM travel_votes tv
  LEFT JOIN travel_vote_participants tvp ON tv.uuid = tvp.vote_uuid
  WHERE tv.group_uuid = ? AND tv.vote_deadline > NOW()
  GROUP BY tv.uuid
  ORDER BY tv.created_at DESC
`;

const INSERT_TRAVEL_VOTE_PARTICIPANT = `
  INSERT INTO travel_vote_participants (vote_uuid, user_uuid)
  VALUES (?, ?)
`;

const DELETE_TRAVEL_VOTE_PARTICIPANT = `
  DELETE FROM travel_vote_participants
  WHERE vote_uuid = ? AND user_uuid = ?
`;

const CHECK_IS_GROUP_MEMBER = `
  SELECT 1 FROM group_members
  WHERE group_uuid = ? AND user_uuid = ?
  LIMIT 1
`;

module.exports = {
  INSERT_TRAVEL_VOTE,
  SELECT_LATEST_TRAVEL_VOTE_BY_CREATOR,
  SELECT_TRAVEL_VOTES_BY_GROUP,
  INSERT_TRAVEL_VOTE_PARTICIPANT,
  DELETE_TRAVEL_VOTE_PARTICIPANT,
  CHECK_IS_GROUP_MEMBER,
};
