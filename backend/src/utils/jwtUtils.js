// /backend/src/utils/jwtUtils.js
const { SignJWT, jwtVerify, decodeJwt } = require('jose');
const { TextEncoder } = require('util');
const dotenv = require('dotenv');

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'default';
const secretKey = new TextEncoder().encode(jwtSecret);

const ACCESS_TOKEN_EXPIRATION = "1h";   // 1시간 만료
const REFRESH_TOKEN_EXPIRATION = "3d";   // 3일 만료

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;          // 1시간 (밀리초)
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

module.exports = {
  generateTokens,
  generateAccessToken,
  setAuthCookies,
  setAccessCookie,
  jwtVerify,
  decodeJwt,
  secretKey,
};