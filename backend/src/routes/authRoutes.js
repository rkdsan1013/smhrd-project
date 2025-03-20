// /backend/src/routes/authRoutes.js
const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

// Multer: 메모리 스토리지 사용 (원한다면 파일 크기, 형식 제한 추가)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/sign-up', upload.single('profilePicture'), authController.signUp);
router.post('/sign-in', authController.signIn);
router.post('/check-email', authController.checkEmail);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;