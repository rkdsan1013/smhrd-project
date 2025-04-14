const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const scheduleController = require("../controllers/scheduleController");
const voteModel = require("../models/voteModel"); // 그룹 멤버 체크용
const router = express.Router();

// 입력 유효성 검사 미들웨어
const validateScheduleInput = (req, res, next) => {
  const { title, start_time, end_time, type, group_uuid } = req.body;
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: "필수 필드가 누락되었습니다." });
  }
  if (type === "group" && !group_uuid) {
    return res
      .status(400)
      .json({ success: false, message: "그룹 일정은 group_uuid가 필요합니다." });
  }
  next();
};

// 그룹 멤버 여부 확인 미들웨어
const checkGroupMember = async (req, res, next) => {
  const groupUuid = req.body.group_uuid || req.query.group_uuid;
  const userUuid = req.user.uuid;
  if (groupUuid) {
    const isMember = await voteModel.checkIsGroupMember(groupUuid, userUuid);
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "그룹 멤버만 이 작업을 수행할 수 있습니다." });
    }
  }
  next();
};

// GET /api/schedules
// 사용자의 모든 일정 조회 (그룹 일정은 그룹 멤버만)
router.get("/", verifyToken, checkGroupMember, (req, res, next) => {
  console.log(
    `GET /api/schedules called by user ${req.user.uuid}, group_uuid: ${
      req.query.group_uuid || "none"
    }`,
  );
  scheduleController.getSchedules(req, res, next);
});

// POST /api/schedules
// 새 일정 생성 (그룹 일정은 그룹 멤버만, 투표와 별개로 생성)
router.post("/", verifyToken, validateScheduleInput, checkGroupMember, (req, res, next) => {
  console.log(
    `POST /api/schedules called by user ${req.user.uuid}, body: ${JSON.stringify(req.body)}`,
  );
  scheduleController.createSchedule(req, res, next);
});

// PUT /api/schedules/:uuid
// 일정 수정
router.put("/:uuid", verifyToken, (req, res, next) => {
  console.log(
    `PUT /api/schedules/${req.params.uuid} called by user ${req.user.uuid}, body: ${JSON.stringify(
      req.body,
    )}`,
  );
  scheduleController.updateSchedule(req, res, next);
});

// DELETE /api/schedules/:uuid
// 일정 삭제
router.delete("/:uuid", verifyToken, (req, res, next) => {
  console.log(`DELETE /api/schedules/${req.params.uuid} called by user ${req.user.uuid}`);
  scheduleController.deleteSchedule(req, res, next);
});

// GET /api/schedules/:scheduleUuid/chat
// 일정의 채팅방 UUID 조회
router.get("/:scheduleUuid/chat", verifyToken, (req, res, next) => {
  console.log(`GET /api/schedules/${req.params.scheduleUuid}/chat called by user ${req.user.uuid}`);
  scheduleController.getScheduleChatRoomUuid(req, res, next);
});

module.exports = router;
