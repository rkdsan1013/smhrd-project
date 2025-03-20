// /backend/src/models/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController.js');
const verifyToken = require('../middlewares/verifyToken.js');

// Multer memoryStorage 설정
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 회원가입 시, "profilePicture" 필드의 파일 한 개 처리
router.post('/sign-up', upload.single('profilePicture'), authController.signUp);
router.post('/sign-in', authController.signIn);
router.post('/check-email', authController.checkEmail);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;