// /backend/src/utils/jwtUtils.js
const { SignJWT, jwtVerify, decodeJwt } = require("jose");
const { TextEncoder } = require("util");

const jwtSecret = process.env.JWT_SECRET || "default";
const secretKey = new TextEncoder().encode(jwtSecret);

const ACCESS_TOKEN_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "7d";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1시간
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7일

// access 및 refresh 토큰 생성
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

// access 토큰 단독 생성
const generateAccessToken = async (uuid) => {
  return new SignJWT({ uuid })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(secretKey);
};

// 쿠키에 access 및 refresh 토큰 설정
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

// 쿠키에 access 토큰 단독 설정
const setAccessCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
};

module.exports = {
  generateTokens,
  generateAccessToken,
  setAuthCookies,
  setAccessCookie,
  jwtVerify,
  decodeJwt,
  secretKey,
};
