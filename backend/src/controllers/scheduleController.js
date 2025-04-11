// /backend/src/controllers/scheduleController.js

const scheduleModel = require("../models/scheduleModel");
const { v4: uuidv4 } = require("uuid");

/**
 * GET /api/schedules
 * JWT 토큰의 사용자(owner_uuid)를 기준으로 자신의 모든 일정을 조회합니다.
 */
const getSchedules = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const schedules = await scheduleModel.findAllByOwner(owner_uuid);
    return res.json({ success: true, schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

/**
 * POST /api/schedules
 * 새로운 일정을 생성합니다.
 * 클라이언트에서는 title, description, location, start_time, end_time, type만 전달하며,
 * owner_uuid는 JWT 토큰으로부터 req.user.uuid로 자동 할당합니다.
 */
const createSchedule = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const { title, description, location, start_time, end_time, type } = req.body;
    const schedule = {
      uuid: uuidv4(), // 새로운 일정의 고유 id 생성
      title,
      description,
      location,
      start_time,
      end_time,
      type,
      owner_uuid,
    };
    await scheduleModel.create(schedule);
    return res.status(201).json({ success: true, schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({
      success: false,
      message: "일정 생성 중 오류가 발생했습니다.",
    });
  }
};

/**
 * PUT /api/schedules/:uuid
 * 기존 일정을 수정합니다.
 * 요청자의 소유(owner_uuid) 여부를 확인한 후 업데이트합니다.
 */
const updateSchedule = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const { uuid } = req.params;
    const { title, description, location, start_time, end_time, type } = req.body;
    // 해당 일정이 존재하는지와 소유자인지 확인합니다.
    const existingSchedule = await scheduleModel.findById(uuid, owner_uuid);
    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: "해당 일정이 존재하지 않습니다." });
    }
    await scheduleModel.update(uuid, owner_uuid, {
      title,
      description,
      location,
      start_time,
      end_time,
      type,
    });
    const updatedSchedule = await scheduleModel.findById(uuid, owner_uuid);
    return res.json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return res.status(500).json({
      success: false,
      message: "일정 업데이트 중 오류가 발생했습니다.",
    });
  }
};

/**
 * DELETE /api/schedules/:uuid
 * 해당 일정을 삭제합니다.
 * 요청자의 소유 여부를 확인 후 삭제합니다.
 */
const deleteSchedule = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const { uuid } = req.params;
    const existingSchedule = await scheduleModel.findById(uuid, owner_uuid);
    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: "해당 일정이 존재하지 않습니다." });
    }
    await scheduleModel.remove(uuid, owner_uuid);
    return res.json({ success: true, message: "일정이 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return res.status(500).json({
      success: false,
      message: "일정 삭제 중 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
