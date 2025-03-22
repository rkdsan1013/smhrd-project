// /backend/src/controllers/userController.js
const userModel = require("../models/userModel");

exports.getProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const profile = await userModel.getUserProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: "프로필 정보를 찾을 수 없습니다." });
    }

    // 항상 서버 URL을 profile_picture 앞에 추가
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    if (profile.profile_picture) {
      profile.profile_picture = serverUrl + profile.profile_picture;
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("[getProfile] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

exports.getUserProfileByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ success: false, message: "유효한 uuid를 제공해주세요." });
    }

    const profile = await userModel.getUserProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: "프로필 정보를 찾을 수 없습니다." });
    }

    // 항상 서버 URL을 profile_picture 앞에 추가
    const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
    if (profile.profile_picture) {
      profile.profile_picture = serverUrl + profile.profile_picture;
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("[getUserProfileByUuid] Internal Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};
