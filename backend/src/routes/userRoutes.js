// /backend/src/routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// 자신의 프로필 조회
router.get("/profile", verifyToken, userController.getProfile);
// 타인의 프로필 조회 (uuid 파라미터)
router.get("/:uuid", verifyToken, userController.getProfileByUuid);

module.exports = router;
