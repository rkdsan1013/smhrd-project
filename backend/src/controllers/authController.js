// /backend/src/controllers/authController.js
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify, decodeJwt } from "jose";
import { TextEncoder } from "util";
import { validateEmail, validatePassword } from "../utils/validators.js";
import userModel from "../models/userModel.js";

const jwtSecret = process.env.JWT_SECRET || "default";
const secretKey = new TextEncoder().encode(jwtSecret);

const ACCESS_TOKEN_EXPIRATION = "1h";   // 1시간 만료
const REFRESH_TOKEN_EXPIRATION = "3d";  // 3일 만료

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;            // 1시간 (밀리초)
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

// Promise 기반 wrapper
const createUserAsync = (email, hashedPassword) =>
  new Promise((resolve, reject) => {
    userModel.createUser(email, hashedPassword, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const getUserByEmailAsync = (email) =>
  new Promise((resolve, reject) => {
    userModel.getUserByEmail(email, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

// 쿠키 설정 헬퍼
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
};

const setAuthCookies = (res, tokens) => {
  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
};

const setAccessCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
};

export const checkEmail = async (req, res) => {
  const { email } = req.body;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res
      .status(400)
      .json({ message: emailValidation.message || "유효한 이메일 주소를 입력하세요." });
  }

  try {
    const results = await getUserByEmailAsync(email);
    res.json({ exists: results.length > 0 });
  } catch (err) {
    console.error("[checkEmail] Database error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const signUp = async (req, res) => {
  const { email, password } = req.body;
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
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUserAsync(email, hashedPassword);
    const results = await getUserByEmailAsync(email);
    if (!results || results.length === 0) {
      return res.status(500).json({ message: "회원가입 후 사용자 조회에 실패했습니다." });
    }
    const user = results[0];
    const tokens = await generateTokens(user.uuid);
    setAuthCookies(res, tokens);
    res.json({ success: true, user: { uuid: user.uuid, email: user.email } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
    }
    console.error("[signUp] Server error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const results = await getUserByEmailAsync(email);
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
      // 사용자 활동중: 두 토큰 모두 갱신
      const tokens = await generateTokens(payload.uuid);
      setAuthCookies(res, tokens);
    } else {
      // 비활동: access 토큰만 갱신, refresh 토큰은 유지
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