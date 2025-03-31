// /backend/src/controllers/userController.js
const userModel = require("../models/userModel");

// 서버 URL을 프로필 이미지 앞에 추가
const formatProfile = (profile) => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (profile.profile_picture) {
    profile.profile_picture = serverUrl + profile.profile_picture;
  }
  return profile;
};

// 타인 프로필에서 제한된 정보 반환 (이름, 이메일, 프로필 사진)
const filterLimitedProfile = (profile) => ({
  name: profile.name,
  email: profile.email,
  profile_picture: profile.profile_picture,
});

// 자신의 프로필 조회 (모든 정보 반환)
exports.getProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const profile = await userModel.getProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "프로필 정보를 찾을 수 없습니다.",
      });
    }
    res.json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    console.error("[getProfile] Error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// 타인의 프로필 조회 (제한된 정보 반환)
exports.getProfileByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: "유효한 uuid를 제공해주세요.",
      });
    }
    const profile = await userModel.getProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "프로필 정보를 찾을 수 없습니다.",
      });
    }
    const formattedProfile = formatProfile(profile);
    const limitedProfile = filterLimitedProfile(formattedProfile);
    res.json({ success: true, profile: limitedProfile });
  } catch (error) {
    console.error("[getProfileByUuid] Internal Error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// 친구 목록 조회
exports.getFriends = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({
        success: false,
        message: "유효한 uuid를 제공해주세요.",
      });
    }
    const friends = await userModel.getFriendsByUuid(uuid);

    if (friends.length === 0) {
      return res.status(404).json({
        success: false,
        message: "친구 목록을 찾을 수 없습니다.",
      });
    }

    res.json({ success: true, friends });
  } catch (error) {
    console.error("[getFriends] Error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};