// /backend/src/routes/groupRoutes.js

const express = require("express");
const groupController = require("../controllers/groupController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 내 그룹 목록 조회
router.get("/my", verifyToken, groupController.getMyGroups);

// 그룹 검색
router.post("/search", verifyToken, groupController.searchGroups);

// 그룹 아이콘 및 그룹 사진 업로드를 위한 필드 설정
const cpUpload = upload.fields([
  { name: "groupIcon", maxCount: 1 },
  { name: "groupPicture", maxCount: 1 },
]);

// 그룹 생성 (이미지 업로드 및 리사이즈 미들웨어 적용)
router.post("/", verifyToken, cpUpload, resizeImage, groupController.createGroup);

// 그룹 멤버 조회
router.get("/:groupUuid/members", verifyToken, groupController.getGroupMembers);

// 그룹 채팅방 UUID 조회
router.get("/:groupUuid/chatroom", verifyToken, groupController.getGroupChatRoom);

// 그룹 리더(사용자) 프로필 조회
router.get("/profile/:uuid", verifyToken, groupController.getUserProfile);

module.exports = router;
