// /backend/src/models/scheduleModel.js

const pool = require("../config/db");
const scheduleQueries = require("./scheduleQueries");

async function findAllByOwner(owner_uuid, group_uuid = null) {
  console.log(
    `findAllByOwner: Fetching schedules for user ${owner_uuid}, group ${group_uuid || "all"}`,
  );
  try {
    let query = scheduleQueries.getSchedulesByOwner;
    const params = [owner_uuid, owner_uuid]; // s.owner_uuid와 sm.user_uuid에 동일 값 사용

    if (group_uuid) {
      query = `
        SELECT DISTINCT s.uuid, s.title, s.description, s.location, s.start_time, s.end_time, s.type, s.owner_uuid, s.group_uuid
        FROM schedules s
        LEFT JOIN schedule_members sm ON s.uuid = sm.schedule_uuid
        WHERE (s.owner_uuid = ? OR sm.user_uuid = ?) AND s.group_uuid = ?
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
    // group_uuid 값이 undefined인 경우 null을 전달하여 항상 9개 파라미터가 전달되도록 함
    const params = [
      uuid,
      title,
      description,
      location,
      start_time,
      end_time,
      type,
      owner_uuid,
      group_uuid === undefined ? null : group_uuid,
    ];
    await pool.query(scheduleQueries.INSERT_SCHEDULE, params);

    // 그룹 일정일 경우 생성자를 schedule_members에 추가
    if (group_uuid) {
      await pool.query(scheduleQueries.INSERT_SCHEDULE_MEMBER, [uuid, owner_uuid]);
    }

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
    // 기존 스케줄 정보를 먼저 조회하여 업데이트할 누락된 필드의 기본값으로 사용합니다.
    const existingSchedule = await findById(uuid, owner_uuid);

    const titleFinal = updateData.title !== undefined ? updateData.title : existingSchedule.title;
    const descriptionFinal =
      updateData.description !== undefined ? updateData.description : existingSchedule.description;
    const locationFinal =
      updateData.location !== undefined ? updateData.location : existingSchedule.location;
    const startTimeFinal =
      updateData.start_time !== undefined ? updateData.start_time : existingSchedule.start_time;
    const endTimeFinal =
      updateData.end_time !== undefined ? updateData.end_time : existingSchedule.end_time;
    const finalType = updateData.type !== undefined ? updateData.type : existingSchedule.type;

    const params = [
      titleFinal,
      descriptionFinal,
      locationFinal,
      startTimeFinal,
      endTimeFinal,
      finalType,
      uuid,
      owner_uuid,
    ];
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
