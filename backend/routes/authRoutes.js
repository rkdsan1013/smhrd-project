// /routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/check-email', authController.checkEmail);
router.post('/sign-up', authController.signUp);
router.post('/sign-in', authController.signIn);

module.exports = router;
