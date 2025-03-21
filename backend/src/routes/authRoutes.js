// /backend/src/routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");
// 위에서 만든 이미지 업로드 관련 미들웨어를 불러옵니다.
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 회원가입 시 profilePicture 필드에 대해 이미지 업로드 후 자동 리사이징 처리
router.post("/sign-up", upload.single("profilePicture"), resizeImage, authController.signUp);

// 기타 라우터들
router.post("/sign-in", authController.signIn);
router.post("/check-email", authController.checkEmail);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getCurrentUser);

module.exports = router;
