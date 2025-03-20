// /backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyToken');

// 자신의 프로필을 조회 (로그인한 사용자)
router.get('/profile', verifyToken, userController.getProfile);

// 파라미터에 따른 다른 사용자의 프로필 조회
router.get('/:uuid', verifyToken, userController.getUserProfileByUuid);

module.exports = router;