// 그룹 내 투표 삽입 (제목과 일정 UUID 포함)
const INSERT_TRAVEL_VOTE_WITH_TITLE_AND_SCHEDULE = `
  INSERT INTO travel_votes (
    uuid, group_uuid, creator_uuid, title,
    location, start_date, end_date,
    headcount, description, vote_deadline, schedule_uuid
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// 그룹 내 투표 목록 조회 (참여자 수와 참여 여부 포함)
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
  WHERE tv.group_uuid = ? AND tv.vote_deadline > UTC_TIMESTAMP()
  GROUP BY tv.uuid
  ORDER BY tv.created_at DESC
`;

// 투표 참여자 추가
const INSERT_TRAVEL_VOTE_PARTICIPANT = `
  INSERT INTO travel_vote_participants (vote_uuid, user_uuid)
  VALUES (?, ?)
`;

// 투표 참여자 삭제
const DELETE_TRAVEL_VOTE_PARTICIPANT = `
  DELETE FROM travel_vote_participants
  WHERE vote_uuid = ? AND user_uuid = ?
`;

// 그룹 멤버 여부 확인
const CHECK_IS_GROUP_MEMBER = `
  SELECT 1 FROM group_members
  WHERE group_uuid = ? AND user_uuid = ?
  LIMIT 1
`;

// 일정 멤버 추가 (중복 방지)
const INSERT_SCHEDULE_MEMBER_IF_NOT_EXISTS = `
  INSERT IGNORE INTO schedule_members (schedule_uuid, user_uuid)
  VALUES (?, ?)
`;

// 일정 멤버 삭제
const DELETE_SCHEDULE_MEMBER = `
  DELETE FROM schedule_members
  WHERE schedule_uuid = ? AND user_uuid = ?
`;

module.exports = {
  INSERT_TRAVEL_VOTE_WITH_TITLE_AND_SCHEDULE,
  SELECT_TRAVEL_VOTES_BY_GROUP,
  INSERT_TRAVEL_VOTE_PARTICIPANT,
  DELETE_TRAVEL_VOTE_PARTICIPANT,
  CHECK_IS_GROUP_MEMBER,
  INSERT_SCHEDULE_MEMBER_IF_NOT_EXISTS,
  DELETE_SCHEDULE_MEMBER,
};
