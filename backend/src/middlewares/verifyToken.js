// /backend/src/middlewares/verifyToken.js
const { jwtVerify, secretKey } = require('../utils/jwtUtils');

const verifyToken = async (req, res, next) => {
  const token = req.cookies && req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }
  try {
    const { payload } = await jwtVerify(token, secretKey);
    req.user = payload;
    next();
  } catch (err) {
    console.error("토큰 검증 실패:", err);
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

module.exports = verifyToken;