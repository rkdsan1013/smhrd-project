// /backend/src/routes/groupRoutes.js
const express = require("express");
const groupController = require("../controllers/groupController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 내가 가입한 그룹 조회 엔드포인트 (GET /groups/my)
router.get("/my", verifyToken, groupController.getMyGroups);

// 그룹 생성 엔드포인트 (POST /groups)
const cpUpload = upload.fields([
  { name: "groupIcon", maxCount: 1 },
  { name: "groupPicture", maxCount: 1 },
]);
router.post("/", verifyToken, cpUpload, resizeImage, groupController.createGroup);

module.exports = router;
