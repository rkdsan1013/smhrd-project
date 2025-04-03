// /backend/src/routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");
const { upload, resizeImage } = require("../middlewares/uploadImage");

const router = express.Router();

// 회원가입 (프로필 이미지 업로드 후 리사이징)
router.post("/sign-up", upload.single("profilePicture"), resizeImage, authController.signUp);

// 로그인, 이메일 중복 확인, 토큰 갱신, 로그아웃, 현재 사용자 조회
router.post("/sign-in", authController.signIn);
router.post("/check-email", authController.checkEmail);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getCurrentUser);

// 비밀번호 변경 (인증 필요)
router.patch("/change-password", verifyToken, authController.changePassword);

// 회원 탈퇴 (인증 필요)
router.post("/withdraw", verifyToken, authController.withdrawAccount);

module.exports = router;
