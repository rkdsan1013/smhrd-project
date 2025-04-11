// /backend/src/models/scheduleModel.js

const pool = require("../config/db");
const queries = require("./scheduleQueries");

/**
 * 사용자(owner_uuid)에 해당하는 모든 일정을 조회합니다.
 */
async function findAllByOwner(owner_uuid) {
  const [rows] = await pool.execute(queries.getSchedulesByOwner, { owner_uuid });
  return rows;
}

/**
 * 특정 일정(uuid)이 존재하는지, 그리고 해당 사용자의 소유인지 확인합니다.
 */
async function findById(uuid, owner_uuid) {
  const [rows] = await pool.execute(queries.getScheduleById, { uuid, owner_uuid });
  return rows[0];
}

/**
 * 새로운 일정을 생성합니다.
 * schedule 객체는 (uuid, title, description, location, start_time, end_time, type, owner_uuid)를 포함합니다.
 */
async function create(schedule) {
  const [result] = await pool.execute(queries.insertSchedule, schedule);
  return result;
}

/**
 * 해당 일정(uuid, owner_uuid)을 업데이트합니다.
 */
async function update(uuid, owner_uuid, updateData) {
  const params = { uuid, owner_uuid, ...updateData };
  const [result] = await pool.execute(queries.updateSchedule, params);
  return result;
}

/**
 * 해당 일정(uuid, owner_uuid)을 삭제합니다.
 */
async function remove(uuid, owner_uuid) {
  const [result] = await pool.execute(queries.deleteSchedule, { uuid, owner_uuid });
  return result;
}

module.exports = {
  findAllByOwner,
  findById,
  create,
  update,
  remove,
};
