// /backend/src/routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 회원가입: 이미지 업로드 및 리사이징 후 처리
router.post("/sign-up", upload.single("profilePicture"), resizeImage, authController.signUp);

// 로그인, 이메일 중복 확인, 토큰 갱신, 로그아웃, 현재 사용자 조회
router.post("/sign-in", authController.signIn);
router.post("/check-email", authController.checkEmail);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getCurrentUser);

// 비밀번호 변경: 인증된 사용자만 접근
router.patch("/change-password", verifyToken, authController.changePassword);

module.exports = router;
