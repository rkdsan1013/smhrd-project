// backend/src/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const verifyToken = require("../middlewares/verifyToken");

// DM 채팅방 생성 또는 조회
router.post("/dm", verifyToken, chatController.openOrCreateDMRoom);

module.exports = router;
