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

// 자신의 프로필 업데이트 (PATCH /profile)
exports.updateProfile = async (req, res) => {
  try {
    // verifyToken 미들웨어에서 설정한 사용자 정보에서 uuid를 가져옴
    const { uuid } = req.user;
    // 클라이언트에서 전달한 업데이트 데이터 (예: name, bio, phone 등)
    const updateData = req.body;

    // 입력 데이터에 대한 검증이 필요한 경우 여기에서 진행(예: express-validator 또는 Joi 사용)
    // 예: if (!updateData.name) { ... }

    // userModel의 업데이트 함수 호출 (예: updateProfileByUuid)
    const result = await userModel.updateProfileByUuid(uuid, updateData);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "프로필 업데이트에 실패했습니다.",
      });
    }

    // 업데이트된 데이터를 다시 조회해서 클라이언트에 넘김
    const updatedProfile = await userModel.getProfileByUuid(uuid);
    res.status(200).json({
      success: true,
      message: "프로필이 업데이트되었습니다.",
      profile: formatProfile(updatedProfile),
    });
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};
