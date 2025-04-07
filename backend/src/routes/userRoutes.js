// /backend/src/routes/userRoutes.js

const express = require("express");
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 자신의 프로필 조회
router.get("/profile", verifyToken, userController.getProfile);

// 타인의 프로필 조회 (uuid 파라미터)
router.get("/:uuid", verifyToken, userController.getProfileByUuid);

// 🔹 상대방 프로필 + 친구 상태 조회 (이 라우트가 아래보다 먼저 선언되어야 함)
router.get("/profile-with-status/:uuid", verifyToken, userController.getProfileWithFriendStatus);

// 자신의 프로필 업데이트 (이미지 전처리 적용)
router.patch(
  "/profile",
  verifyToken,
  upload.single("profilePicture"),
  resizeImage,
  userController.updateProfile,
);

module.exports = router;
