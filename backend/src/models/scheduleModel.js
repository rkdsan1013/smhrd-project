const pool = require("../config/db");
const scheduleQueries = require("./scheduleQueries");

async function findAllByOwner(owner_uuid, group_uuid = null) {
  console.log(
    `findAllByOwner: Fetching schedules for user ${owner_uuid}, group ${group_uuid || "all"}`,
  );
  try {
    let query = scheduleQueries.getSchedulesByOwner;
    const params = [owner_uuid];

    if (group_uuid) {
      query = `
        SELECT uuid, title, description, location, start_time, end_time, type, owner_uuid, group_uuid
        FROM schedules
        WHERE owner_uuid = ? AND group_uuid = ?
      `;
      params.push(group_uuid);

      // 그룹 멤버 여부 확인
      const [memberRows] = await pool.query(
        `SELECT 1 FROM group_members WHERE group_uuid = ? AND user_uuid = ?`,
        [group_uuid, owner_uuid],
      );
      if (memberRows.length === 0) {
        throw new Error("그룹 멤버가 아닙니다.");
      }
    }

    const [rows] = await pool.query(query, params);
    console.log(`findAllByOwner: Retrieved ${rows.length} schedules`);
    return rows;
  } catch (error) {
    console.error(`findAllByOwner error: ${error.message}`);
    throw new Error(`일정 조회 실패: ${error.message}`);
  }
}

async function findById(uuid, owner_uuid) {
  console.log(`findById: Fetching schedule ${uuid} for user ${owner_uuid}`);
  try {
    const [rows] = await pool.query(scheduleQueries.getScheduleById, [uuid, owner_uuid]);
    if (rows.length === 0) {
      throw new Error("일정 없음 또는 소유자가 아님");
    }
    console.log(`findById: Found schedule ${uuid}`);
    return rows[0];
  } catch (error) {
    console.error(`findById error: ${error.message}`);
    throw new Error(`일정 조회 실패: ${error.message}`);
  }
}

async function create(schedule) {
  console.log(`create: Creating schedule for user ${schedule.owner_uuid}`);
  try {
    const {
      uuid,
      title,
      description,
      location,
      start_time,
      end_time,
      type,
      owner_uuid,
      group_uuid,
    } = schedule;
    const params = [
      uuid,
      title,
      description,
      location,
      start_time,
      end_time,
      type,
      owner_uuid,
      group_uuid,
    ].filter((v) => v !== undefined);
    await pool.query(scheduleQueries.insertSchedule, params);
    console.log(`create: Schedule ${uuid} created`);
    return { uuid };
  } catch (error) {
    console.error(`create error: ${error.message}`);
    throw new Error(`일정 생성 실패: ${error.message}`);
  }
}

async function update(uuid, owner_uuid, updateData) {
  console.log(`update: Updating schedule ${uuid} for user ${owner_uuid}`);
  try {
    const { title, description, location, start_time, end_time, type } = updateData;
    const params = [
      title,
      description,
      location,
      start_time,
      end_time,
      type,
      uuid,
      owner_uuid,
    ].filter((v) => v !== undefined);
    const [result] = await pool.query(scheduleQueries.updateSchedule, params);
    if (result.affectedRows === 0) {
      throw new Error("일정 없음 또는 소유자가 아님");
    }
    console.log(`update: Schedule ${uuid} updated`);
    return result;
  } catch (error) {
    console.error(`update error: ${error.message}`);
    throw new Error(`일정 업데이트 실패: ${error.message}`);
  }
}

async function remove(uuid, owner_uuid) {
  console.log(`remove: Deleting schedule ${uuid} for user ${owner_uuid}`);
  try {
    const [result] = await pool.query(scheduleQueries.deleteSchedule, [uuid, owner_uuid]);
    if (result.affectedRows === 0) {
      throw new Error("일정 없음 또는 소유자가 아님");
    }
    console.log(`remove: Schedule ${uuid} deleted`);
    return result;
  } catch (error) {
    console.error(`remove error: ${error.message}`);
    throw new Error(`일정 삭제 실패: ${error.message}`);
  }
}

async function isScheduleParticipant(schedule_uuid, user_uuid) {
  console.log(`isScheduleParticipant: Checking user ${user_uuid} for schedule ${schedule_uuid}`);
  try {
    // schedule_members 또는 travel_vote_participants로 확인
    const [rows] = await pool.query(
      `
      SELECT 1
      FROM (
        SELECT schedule_uuid, user_uuid FROM schedule_members
        UNION
        SELECT tv.schedule_uuid, tvp.user_uuid
        FROM travel_vote_participants tvp
        JOIN travel_votes tv ON tv.uuid = tvp.vote_uuid
      ) AS participants
      WHERE schedule_uuid = ? AND user_uuid = ?
      LIMIT 1
      `,
      [schedule_uuid, user_uuid],
    );
    const isParticipant = rows.length > 0;
    console.log(
      `isScheduleParticipant: User ${user_uuid} is ${isParticipant ? "" : "not "}participant`,
    );
    return isParticipant;
  } catch (error) {
    console.error(`isScheduleParticipant error: ${error.message}`);
    throw new Error(`참여자 확인 실패: ${error.message}`);
  }
}

async function findChatRoomByScheduleUuid(schedule_uuid) {
  console.log(`findChatRoomByScheduleUuid: Fetching chat room for schedule ${schedule_uuid}`);
  try {
    const [rows] = await pool.query(scheduleQueries.SELECT_CHAT_ROOM_UUID_BY_SCHEDULE, [
      schedule_uuid,
    ]);
    if (rows.length === 0) {
      throw new Error("채팅방 없음");
    }
    console.log(`findChatRoomByScheduleUuid: Found chat room ${rows[0].uuid}`);
    return rows[0];
  } catch (error) {
    console.error(`findChatRoomByScheduleUuid error: ${error.message}`);
    throw new Error(`채팅방 조회 실패: ${error.message}`);
  }
}

async function findVoteTitleByScheduleUuid(schedule_uuid) {
  console.log(`findVoteTitleByScheduleUuid: Fetching vote title for schedule ${schedule_uuid}`);
  try {
    const [rows] = await pool.query(scheduleQueries.SELECT_VOTE_TITLE_BY_SCHEDULE_UUID, [
      schedule_uuid,
    ]);
    const title = rows.length > 0 ? rows[0].title : null;
    console.log(`findVoteTitleByScheduleUuid: Found title ${title || "none"}`);
    return title;
  } catch (error) {
    console.error(`findVoteTitleByScheduleUuid error: ${error.message}`);
    throw new Error(`투표 제목 조회 실패: ${error.message}`);
  }
}

module.exports = {
  findAllByOwner,
  findById,
  create,
  update,
  remove,
  findChatRoomByScheduleUuid,
  isScheduleParticipant,
  findVoteTitleByScheduleUuid,
};
