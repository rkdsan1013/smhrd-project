// /backend/src/middlewares/verifyToken.js
const { jwtVerify } = require('jose');
const { TextEncoder } = require('util');

const jwtSecret = process.env.JWT_SECRET || 'default';
const secretKey = new TextEncoder().encode(jwtSecret);

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: '토큰이 없습니다.' });
  }
  try {
    const { payload } = await jwtVerify(token, secretKey);
    req.user = payload; // payload: { uuid, exp, ... }
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: '토큰 검증 실패' });
  }
};

module.exports = verifyToken;