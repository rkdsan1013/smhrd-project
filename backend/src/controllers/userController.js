// /backend/src/controllers/userController.js
const userModel = require('../models/userModel');

/**
 * GET /api/users/profile
 * 로그인한 사용자의 프로필 정보를 조회합니다.
 */
exports.getProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const profile = await userModel.getUserProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: '프로필 정보를 찾을 수 없습니다.' });
    }
    // 서버 URL을 가져오고 profile_picture가 절대 URL이 아니면 붙여줌
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    if (profile.profile_picture && !profile.profile_picture.startsWith("http")) {
      profile.profile_picture = serverUrl + profile.profile_picture;
    }
    res.json({ success: true, profile });
  } catch (error) {
    console.error("[getProfile] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

/**
 * GET /api/users/:uuid
 * 요청한 uuid에 해당하는 사용자의 프로필 정보를 조회합니다.
 */
exports.getUserProfileByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ success: false, message: "유효한 uuid를 제공해주세요." });
    }
    const profile = await userModel.getUserProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: '프로필 정보를 찾을 수 없습니다.' });
    }
    // 서버 URL을 가져오고 profile_picture가 절대 URL이 아니면 붙여줌
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    if (profile.profile_picture && !profile.profile_picture.startsWith("http")) {
      profile.profile_picture = serverUrl + profile.profile_picture;
    }
    res.json({ success: true, profile });
  } catch (error) {
    console.error("[getUserProfileByUuid] Internal Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};