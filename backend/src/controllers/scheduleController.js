// /backend/src/controllers/scheduleController.js

const scheduleModel = require("../models/scheduleModel");
const voteModel = require("../models/voteModel");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

const getSchedules = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const group_uuid = req.query.group_uuid;
    console.log(
      `getSchedules: user ${owner_uuid} fetching schedules, group ${group_uuid || "all"}`,
    );

    const schedules = await scheduleModel.findAllByOwner(owner_uuid, group_uuid);
    console.log(`getSchedules: Returning ${schedules.length} schedules`);
    return res.json({ success: true, schedules });
  } catch (error) {
    console.error(`getSchedules error for user ${req.user.uuid}: ${error.message}`);
    return res.status(500).json({ success: false, message: `일정 조회 중 오류: ${error.message}` });
  }
};

const createSchedule = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const { title, description, location, start_time, end_time, type, group_uuid } = req.body;
    console.log(
      `createSchedule: user ${owner_uuid} creating schedule, group ${group_uuid || "none"}`,
    );

    // 필수 필드 검증
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "title, start_time, end_time은 필수입니다.",
      });
    }

    // 그룹 일정인 경우: 오늘 날짜(자정 기준)보다 이전이면 에러.
    if (group_uuid) {
      const today = moment().startOf("day"); // 오늘의 시작 (자정)
      const startDay = moment(start_time).startOf("day");
      const endDay = moment(end_time).startOf("day");

      if (startDay.isBefore(today) || endDay.isBefore(today)) {
        return res.status(400).json({
          success: false,
          message: "start_time과 end_time은 오늘 날짜부터여야 합니다.",
        });
      }
    }

    // 시간 순서 검증: 시작 시간이 종료 시간보다 늦으면 안 됨 (모든 경우 적용)
    if (new Date(start_time) > new Date(end_time)) {
      return res.status(400).json({
        success: false,
        message: "start_time은 end_time보다 늦을 수 없습니다.",
      });
    }

    // 그룹 일정일 경우 멤버 여부 확인
    if (group_uuid) {
      const isMember = await voteModel.checkIsGroupMember(group_uuid, owner_uuid);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "그룹 멤버만 그룹 일정을 생성할 수 있습니다.",
        });
      }
    }

    // 생성할 일정 객체 구성
    const schedule = {
      uuid: uuidv4(),
      title,
      description,
      location,
      start_time,
      end_time,
      type: type || (group_uuid ? "group" : "personal"),
      owner_uuid,
      group_uuid,
    };

    await scheduleModel.create(schedule);

    // 그룹 일정일 경우 소켓 이벤트 전송
    if (group_uuid) {
      global.io.to(group_uuid).emit("scheduleCreated", {
        scheduleUuid: schedule.uuid,
        groupUuid: group_uuid,
        title,
      });
      console.log(`scheduleCreated emitted to group ${group_uuid}: schedule ${schedule.uuid}`);
    }

    console.log(`createSchedule: Schedule ${schedule.uuid} created`);
    return res.status(201).json({ success: true, schedule });
  } catch (error) {
    console.error(`createSchedule error for user ${req.user.uuid}: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `일정 생성 중 오류: ${error.message}`,
    });
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const owner_uuid = req.user.uuid;
    const { uuid } = req.params;
    // partial update를 허용하므로 title 등은 필수로 검증하지 않고, 다만 start_time과 end_time은 반드시 있어야 합니다.
    const { title, description, location, start_time, end_time, type } = req.body;

    console.log(`updateSchedule: user ${owner_uuid} updating schedule ${uuid}`);

    // 기존 일정 존재 확인
    const existingSchedule = await scheduleModel.findById(uuid, owner_uuid);
    if (!existingSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "해당 일정이 존재하지 않거나 소유자가 아닙니다." });
    }

    // start_time과 end_time은 있어야 함
    if (!start_time || !end_time) {
      return res
        .status(400)
        .json({ success: false, message: "start_time과 end_time은 필수입니다." });
    }

    // 업데이트에 전달되지 않은 필드에 대해서는 모델 쪽에서 기존값을 대체합니다.
    await scheduleModel.update(uuid, owner_uuid, {
      title,
      description,
      location,
      start_time,
      end_time,
      type,
    });
    const updatedSchedule = await scheduleModel.findById(uuid, owner_uuid);
    console.log(`updateSchedule: Schedule ${uuid} updated`);

    return res.json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error(`updateSchedule error for user ${req.user.uuid}: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: `일정 업데이트 중 오류: ${error.message}` });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const owner_uuid = req.user.uuid;
    const { uuid } = req.params;
    console.log(`deleteSchedule: user ${owner_uuid} deleting schedule ${uuid}`);

    const existingSchedule = await scheduleModel.findById(uuid, owner_uuid);
    if (!existingSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "해당 일정이 존재하지 않거나 소유자가 아닙니다." });
    }

    await scheduleModel.remove(uuid, owner_uuid);
    console.log(`deleteSchedule: Schedule ${uuid} deleted`);
    return res.json({ success: true, message: "일정이 삭제되었습니다." });
  } catch (error) {
    console.error(`deleteSchedule error for user ${req.user.uuid}: ${error.message}`);
    return res.status(500).json({ success: false, message: `일정 삭제 중 오류: ${error.message}` });
  }
};

const getScheduleChatRoomUuid = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const { scheduleUuid } = req.params;
    console.log(
      `getScheduleChatRoomUuid: user ${userUuid} fetching chat room for schedule ${scheduleUuid}`,
    );

    // 참여자 권한 체크
    const isParticipant = await scheduleModel.isScheduleParticipant(scheduleUuid, userUuid);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "해당 일정에 참여한 사용자만 접근할 수 있습니다." });
    }

    // 채팅방 UUID 조회
    const chatRoom = await scheduleModel.findChatRoomByScheduleUuid(scheduleUuid);
    const title = await scheduleModel.findVoteTitleByScheduleUuid(scheduleUuid);

    console.log(
      `getScheduleChatRoomUuid: Found chat room ${chatRoom.uuid}, title ${title || "none"}`,
    );
    return res.json({ success: true, chat_room_uuid: chatRoom.uuid, title });
  } catch (error) {
    console.error(`getScheduleChatRoomUuid error for user ${req.user.uuid}: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: `채팅방 정보 조회 중 오류: ${error.message}` });
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleChatRoomUuid,
};
