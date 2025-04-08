// /backend/src/routes/groupRoutes.js

const express = require("express");
const groupController = require("../controllers/groupController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

router.get("/my", verifyToken, groupController.getMyGroups);
router.post("/search", verifyToken, groupController.searchGroups);

const cpUpload = upload.fields([
  { name: "groupIcon", maxCount: 1 },
  { name: "groupPicture", maxCount: 1 },
]);
router.post("/", verifyToken, cpUpload, resizeImage, groupController.createGroup);

// ── 새 엔드포인트: 그룹 멤버 조회 ──
router.get("/:groupUuid/members", verifyToken, groupController.getGroupMembers);

// ── 그룹 리더(사용자) 프로필 조회 ──
router.get("/profile/:uuid", verifyToken, groupController.getUserProfile);

module.exports = router;
