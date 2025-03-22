// /backend/src/controllers/authController.js
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { validateEmail, validatePassword, validateFullProfile } = require("../utils/validators");
const {
  generateTokens,
  generateAccessToken,
  setAuthCookies,
  setAccessCookie,
  jwtVerify,
  decodeJwt,
  secretKey,
} = require("../utils/jwtUtils");
const userModel = require("../models/userModel");

// 이메일 중복 확인
exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res
      .status(400)
      .json({ message: emailValidation.message || "유효한 이메일 주소를 입력하세요." });
  }
  try {
    const results = await userModel.getUserByEmail(email);
    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error("[checkEmail] Database error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 회원가입 처리
exports.signUp = async (req, res) => {
  const { email, password, name, birthdate, gender } = req.body;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  if (!birthdate || !birthdate.includes("-")) {
    return res.status(400).json({ message: "생년월일 형식이 올바르지 않습니다." });
  }
  const [year, month, day] = birthdate.split("-");
  const profileValidation = validateFullProfile(name, year, month, day, gender);
  if (!profileValidation.valid) {
    return res.status(400).json({ message: profileValidation.message });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.signUpUser(
      email.trim().toLowerCase(),
      hashedPassword,
      name,
      birthdate,
      gender,
    );
    if (req.file) {
      const uploadsDir = path.join(__dirname, "../../public/uploads/profile_pictures");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileExtension = req.file.convertedExtension || "webp";
      const fileName = `${user.uuid}.${fileExtension}`;
      const destPath = path.join(uploadsDir, fileName);
      try {
        await fs.promises.writeFile(destPath, req.file.buffer);
      } catch (imageError) {
        console.error("[signUp] 이미지 처리 오류:", imageError);
        throw new Error("이미지 처리 중 오류가 발생했습니다.");
      }
      const profilePicturePath = `/uploads/profile_pictures/${fileName}`;
      await userModel.updateUserProfilePicture(user.uuid, profilePicturePath);
    }
    const tokens = await generateTokens(user.uuid);
    setAuthCookies(res, tokens);
    res.json({ success: true, user: { uuid: user.uuid, email: user.email } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
    }
    console.error("[signUp] Server error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그인 처리
exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const results = await userModel.getUserByEmail(email);
    if (!results || results.length === 0) {
      return res.status(400).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }
    const tokens = await generateTokens(user.uuid);
    setAuthCookies(res, tokens);
    res.json({ success: true, user: { uuid: user.uuid, email: user.email } });
  } catch (error) {
    console.error("[signIn] Server error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 토큰 갱신 처리
exports.refreshToken = async (req, res) => {
  const tokenFromCookie = req.cookies.refreshToken;
  if (!tokenFromCookie) {
    return res.status(400).json({ message: "리프레시 토큰이 제공되지 않았습니다." });
  }
  try {
    let payload;
    try {
      const verified = await jwtVerify(tokenFromCookie, secretKey);
      payload = verified.payload;
    } catch (err) {
      payload = decodeJwt(tokenFromCookie);
      if (!payload || !payload.uuid) {
        return res.status(401).json({ message: "유효하지 않은 리프레시 토큰입니다." });
      }
    }
    const renewRefresh = req.body && req.body.renewRefresh;
    if (renewRefresh) {
      const tokens = await generateTokens(payload.uuid);
      setAuthCookies(res, tokens);
    } else {
      const accessToken = await generateAccessToken(payload.uuid);
      setAccessCookie(res, accessToken);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("[refreshToken] Token refresh error:", error);
    res.status(401).json({ message: "토큰 갱신 실패" });
  }
};

// 현재 사용자 정보 반환
exports.getCurrentUser = (req, res) => {
  if (req.user) {
    res.json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, message: "인증되지 않은 사용자입니다." });
  }
};

// 로그아웃 처리 (쿠키 삭제)
exports.logout = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
  res.json({ success: true, message: "로그아웃되었습니다." });
};
