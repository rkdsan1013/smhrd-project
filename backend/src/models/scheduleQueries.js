// /backend/src/models/scheduleQueries.js

const scheduleQueries = {
  // 일정 삽입 (트랜잭션 및 독립 생성 공용)
  INSERT_SCHEDULE: `
    INSERT INTO schedules (
      uuid, title, description, location,
      start_time, end_time, type,
      owner_uuid, group_uuid
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  // 일정 멤버 추가
  INSERT_SCHEDULE_MEMBER: `
    INSERT INTO schedule_members (schedule_uuid, user_uuid)
    VALUES (?, ?)
  `,

  // 소유자 또는 참가자의 모든 일정 조회
  getSchedulesByOwner: `
    SELECT DISTINCT s.uuid, s.title, s.description, s.location, s.start_time, s.end_time, s.type, s.owner_uuid, s.group_uuid
    FROM schedules s
    LEFT JOIN schedule_members sm ON s.uuid = sm.schedule_uuid
    WHERE s.owner_uuid = ? OR sm.user_uuid = ?
  `,

  // 특정 일정 조회
  getScheduleById: `
    SELECT uuid, title, description, location, start_time, end_time, type, owner_uuid, group_uuid
    FROM schedules
    WHERE uuid = ? AND owner_uuid = ?
  `,

  // 일정 수정
  updateSchedule: `
    UPDATE schedules
    SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?, type = ?
    WHERE uuid = ? AND owner_uuid = ?
  `,

  // 일정 삭제
  deleteSchedule: `
    DELETE FROM schedules
    WHERE uuid = ? AND owner_uuid = ?
  `,

  // 일정 참여 여부 확인 (schedule_members 기반)
  CHECK_SCHEDULE_PARTICIPANT: `
    SELECT 1 FROM schedule_members
    WHERE schedule_uuid = ? AND user_uuid = ?
    LIMIT 1
  `,

  // 투표를 통한 일정 참여 여부 확인
  CHECK_SCHEDULE_PARTICIPANT_BY_VOTE: `
    SELECT 1
    FROM travel_vote_participants tvp
    JOIN travel_votes tv ON tv.uuid = tvp.vote_uuid
    WHERE tv.schedule_uuid = ? AND tvp.user_uuid = ?
    LIMIT 1
  `,

  // 스케줄에 연결된 채팅방 UUID 조회
  SELECT_CHAT_ROOM_UUID_BY_SCHEDULE: `
    SELECT uuid FROM chat_rooms
    WHERE schedule_uuid = ? AND type = 'schedule'
    LIMIT 1
  `,

  // 스케줄에 연결된 투표 제목 조회
  SELECT_VOTE_TITLE_BY_SCHEDULE_UUID: `
    SELECT title FROM travel_votes
    WHERE schedule_uuid = ?
    LIMIT 1
  `,

  GET_EXPIRED_SCHEDULE_CHATROOMS_BY_USER: `
    SELECT 
      cr.uuid AS chat_room_uuid,
      s.title AS schedule_title,
      s.uuid AS schedule_uuid
    FROM schedule_members sm
    JOIN schedules s ON sm.schedule_uuid = s.uuid
    JOIN chat_rooms cr ON cr.schedule_uuid = s.uuid AND cr.type = 'schedule'
    WHERE sm.user_uuid = ?
      AND s.group_uuid = ?
    ORDER BY s.created_at DESC
  `,
};

module.exports = scheduleQueries;
