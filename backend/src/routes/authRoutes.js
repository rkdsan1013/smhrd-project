const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 미들웨어 분리: verifyToken을 별도의 파일에서 불러옵니다.
const verifyToken = require('../middlewares/verifyToken');

router.post('/check-email', authController.checkEmail);
router.post('/sign-up', authController.signUp);
router.post('/sign-in', authController.signIn);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// /me 엔드포인트: verifyToken 미들웨어를 적용하여 인증된 사용자 정보 반환
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;