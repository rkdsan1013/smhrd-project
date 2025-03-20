// /backend/src/controllers/authController.js
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { TextEncoder } from "util";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { validateEmail, validatePassword, validateFullProfile } from "../utils/validators.js";
import userModel from "../models/userModel.js";

// __dirname 정의 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jwtSecret = process.env.JWT_SECRET || "default";
const secretKey = new TextEncoder().encode(jwtSecret);

const ACCESS_TOKEN_EXPIRATION = "1h";   // 1시간 만료
const REFRESH_TOKEN_EXPIRATION = "3d";   // 3일 만료

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;           // 1시간 (밀리초)
const REFRESH_TOKEN_MAX_AGE = 3 * 24 * 60 * 60 * 1000;  // 3일 (밀리초)

const generateTokens = async (uuid) => {
  const payload = { uuid };

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(secretKey);

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(secretKey);

  return { accessToken, refreshToken };
};

const generateAccessToken = async (uuid) => {
  return await new SignJWT({ uuid })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(secretKey);
};

const setAuthCookies = (res, tokens) => {
  res
    .cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
};

const setAccessCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
};

export const checkEmail = async (req, res) => {
  const { email } = req.body;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({
      message: emailValidation.message || "유효한 이메일 주소를 입력하세요.",
    });
  }

  try {
    const results = await userModel.getUserByEmail(email);
    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error("[checkEmail] Database error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const signUp = async (req, res) => {
  // 클라이언트에서 email, password, name, birthdate("YYYY-MM-DD"), gender를 보내며,
  // 프로필 이미지는 multer 미들웨어로 처리되어 req.file에 저장됨
  const { email, password, name, birthdate, gender } = req.body;
  // profilePicture는 파일이 있으면 req.file에 있음

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res
      .status(400)
      .json({ message: emailValidation.message || "유효한 이메일 주소를 입력하세요." });
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
    const user = await userModel.signUpUser(email, hashedPassword, name, birthdate, gender);
    
    // 프로필 이미지 처리: 파일이 업로드된 경우 sharp로 변환하여 저장하고 DB 업데이트
    if (req.file) {
      // 상대 경로: backend/public/uploads/profile_pictures
      const uploadsDir = path.join(__dirname, "../../public/uploads/profile_pictures");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = `${user.uuid}.webp`;
      const destPath = path.join(uploadsDir, fileName);
      try {
        await sharp(req.file.buffer).toFormat("webp").toFile(destPath);
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

export const signIn = async (req, res) => {
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

export const refreshToken = async (req, res) => {
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
    const renewRefresh = req.body?.renewRefresh;
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

export const getCurrentUser = (req, res) => {
  if (req.user) {
    res.json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, message: "인증되지 않은 사용자입니다." });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
  res.json({ success: true, message: "로그아웃되었습니다." });
};