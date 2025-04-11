// /backend/src/routes/scheduleRoutes.js

const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const scheduleController = require("../controllers/scheduleController");

const router = express.Router();

// GET /api/schedules
// JWT 토큰을 통해 인증된 사용자(owner_uuid)를 기준으로 자신의 모든 일정을 조회합니다.
router.get("/", verifyToken, scheduleController.getSchedules);

// POST /api/schedules
// 새로운 일정을 생성합니다. (owner_uuid는 백엔드에서 JWT 토큰을 통해 자동 할당)
router.post("/", verifyToken, scheduleController.createSchedule);

// PUT /api/schedules/:uuid
// 해당 일정의 정보를 수정합니다.
router.put("/:uuid", verifyToken, scheduleController.updateSchedule);

// DELETE /api/schedules/:uuid
// 해당 일정을 삭제합니다.
router.delete("/:uuid", verifyToken, scheduleController.deleteSchedule);

module.exports = router;
