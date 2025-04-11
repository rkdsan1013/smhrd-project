// /backend/src/models/scheduleQueries.js

const queries = {
  // JWT 토큰으로 인증된 사용자의 일정만 가져오기
  getSchedulesByOwner: `
      SELECT uuid, title, description, location, start_time, end_time, type, owner_uuid
      FROM schedules
      WHERE owner_uuid = :owner_uuid
    `,
  getScheduleById: `
      SELECT uuid, title, description, location, start_time, end_time, type, owner_uuid
      FROM schedules
      WHERE uuid = :uuid AND owner_uuid = :owner_uuid
    `,
  insertSchedule: `
      INSERT INTO schedules (uuid, title, description, location, start_time, end_time, type, owner_uuid)
      VALUES (:uuid, :title, :description, :location, :start_time, :end_time, :type, :owner_uuid)
    `,
  updateSchedule: `
      UPDATE schedules
      SET title = :title, description = :description, location = :location, start_time = :start_time, end_time = :end_time, type = :type
      WHERE uuid = :uuid AND owner_uuid = :owner_uuid
    `,
  deleteSchedule: `
      DELETE FROM schedules
      WHERE uuid = :uuid AND owner_uuid = :owner_uuid
    `,
};

module.exports = queries;
