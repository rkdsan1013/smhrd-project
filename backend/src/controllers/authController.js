// /backend/src/controllers/authController.js

const bcrypt = require("bcrypt");
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
const { saveProfilePicture, deleteProfilePicture } = require("../utils/imageHelper");
const { normalizeName } = require("../utils/normalize");

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
    const result = await userModel.getUserByEmail(email);
    const exists = !!result; // result가 있으면 true, 없으면 false
    return res.json({ exists });
  } catch (err) {
    console.error("[checkEmail] DB error:", err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 회원가입 처리
exports.signUp = async (req, res) => {
  const { email, password, name, gender, birthdate } = req.body;
  const paradoxFlag = req.body.paradoxFlag === "1";

  // 이메일, 비밀번호, 생년월일, 프로필 검증
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) return res.status(400).json({ message: emailValidation.message });

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid)
    return res.status(400).json({ message: passwordValidation.message });

  if (!birthdate || !birthdate.includes("-"))
    return res.status(400).json({ message: "생년월일 형식이 올바르지 않습니다." });

  const [year, month, day] = birthdate.split("-");
  const profileValidation = validateFullProfile(name, gender, year, month, day, paradoxFlag);
  if (!profileValidation.valid) return res.status(400).json({ message: profileValidation.message });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // 이름도 정규화하여 저장 (불필요한 공백 제거 및 단일화)
    const normalizedName = normalizeName(name);

    const user = await userModel.signUpUser(
      email.trim().toLowerCase(),
      hashedPassword,
      normalizedName,
      gender,
      birthdate,
      paradoxFlag,
    );

    if (req.file) {
      try {
        const profilePicturePath = await saveProfilePicture(user.uuid, req.file);
        await userModel.updateUserProfilePicture(user.uuid, profilePicturePath);
      } catch (imageError) {
        console.error("[signUp] 이미지 오류:", imageError);
        throw new Error("이미지 처리 중 오류가 발생했습니다.");
      }
    }
    const tokens = await generateTokens(user.uuid);
    setAuthCookies(res, tokens);
    return res.json({ success: true, user: { uuid: user.uuid, email: user.email } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    console.error("[signUp] 서버 오류:", err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그인 처리
exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    // getUserByEmail는 단일 객체를 반환하므로 바로 사용
    const user = await userModel.getUserByEmail(email);
    if (!user)
      return res.status(400).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });

    const tokens = await generateTokens(user.uuid);
    setAuthCookies(res, tokens);
    return res.json({ success: true, user: { uuid: user.uuid, email: user.email } });
  } catch (error) {
    console.error("[signIn] 서버 오류:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 토큰 갱신 처리
exports.refreshToken = async (req, res) => {
  const tokenFromCookie = req.cookies.refreshToken;
  if (!tokenFromCookie)
    return res.status(400).json({ message: "리프레시 토큰이 제공되지 않았습니다." });

  try {
    let payload;
    try {
      const verified = await jwtVerify(tokenFromCookie, secretKey);
      payload = verified.payload;
    } catch (err) {
      payload = decodeJwt(tokenFromCookie);
      if (!payload || !payload.uuid)
        return res.status(401).json({ message: "유효하지 않은 리프레시 토큰입니다." });
    }
    if (req.body && req.body.renewRefresh) {
      const tokens = await generateTokens(payload.uuid);
      setAuthCookies(res, tokens);
    } else {
      const accessToken = await generateAccessToken(payload.uuid);
      setAccessCookie(res, accessToken);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[refreshToken] 토큰 갱신 오류:", error);
    return res.status(401).json({ message: "토큰 갱신 실패" });
  }
};

// 현재 사용자 정보 반환
exports.getCurrentUser = (req, res) => {
  if (req.user) return res.json({ success: true, user: req.user });
  return res.status(401).json({ success: false, message: "인증되지 않은 사용자입니다." });
};

// 로그아웃 (쿠키 삭제)
exports.logout = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
  return res.json({ success: true, message: "로그아웃되었습니다." });
};

// 비밀번호 변경 처리
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요." });

  const newPassValidation = validatePassword(newPassword);
  if (!newPassValidation.valid)
    return res
      .status(400)
      .json({ message: newPassValidation.message || "새 비밀번호가 유효하지 않습니다." });

  try {
    const uuid = req.user.uuid;
    // 단일 객체를 반환하므로 results[0] 대신 바로 사용
    const user = await userModel.getUserByUuid(uuid);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userModel.changeUserPassword(uuid, hashedNewPassword);
    return res.json({ success: true, message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    console.error("[changePassword] 오류:", error);
    return res.status(500).json({ message: "비밀번호 변경 중 오류가 발생했습니다." });
  }
};

// 회원 탈퇴 처리
exports.withdrawAccount = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: "비밀번호를 입력해주세요." });

  const passValidation = validatePassword(password);
  if (!passValidation.valid)
    return res
      .status(400)
      .json({ message: passValidation.message || "비밀번호가 유효하지 않습니다." });

  try {
    const uuid = req.user.uuid;
    // userModel.getUserByUuid는 단일 객체를 반환함
    const userCredentials = await userModel.getUserByUuid(uuid);
    if (!userCredentials) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const userProfile = await userModel.getProfileByUuid(uuid);
    const isMatch = await bcrypt.compare(password, userCredentials.password);
    if (!isMatch) return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });

    if (userProfile && userProfile.profilePicture) {
      await deleteProfilePicture(uuid);
    }

    const deleteResult = await userModel.deleteUserByUuid(uuid);
    if (deleteResult.affectedRows === 0)
      return res.status(500).json({ message: "회원 탈퇴 처리 중 오류가 발생했습니다." });

    res.clearCookie("accessToken").clearCookie("refreshToken");
    return res.json({ success: true, message: "회원 탈퇴가 완료되었습니다." });
  } catch (error) {
    console.error("[withdrawAccount] 오류:", error);
    return res.status(500).json({ message: "회원 탈퇴 처리 중 오류가 발생했습니다." });
  }
};
