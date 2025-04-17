// /backend/src/routes/chatRoutes.js

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const verifyToken = require("../middlewares/verifyToken");

// DM 채팅방 생성 또는 조회
router.post("/dm", verifyToken, chatController.openOrCreateDMRoom);

// 메시지 조회 (프로필 포함)
router.get("/:roomUuid/messages", verifyToken, chatController.getMessagesByRoom);

// DM 채팅방 정리 라우터
router.delete("/cleanup/dm", verifyToken, chatController.cleanUpDMRooms);

module.exports = router;
