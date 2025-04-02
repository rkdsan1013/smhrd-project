// /backend/src/controllers/userController.js
const userModel = require("../models/userModel");
const { saveProfilePicture } = require("../utils/imageHelper");
const { validateName } = require("../utils/validators");

// 서버 URL을 프로필 이미지 앞에 추가
const formatProfile = (profile) => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (profile.profilePicture) {
    profile.profilePicture = serverUrl + profile.profilePicture;
  }
  return profile;
};

// 자신의 프로필 조회 (전체 정보 반환)
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
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 타인의 프로필 조회 (제한된 정보만 반환)
exports.getProfileByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ success: false, message: "유효한 uuid를 제공해주세요." });
    }
    const profile = await userModel.getProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: "프로필 정보를 찾을 수 없습니다." });
    }
    const formattedProfile = formatProfile(profile);
    const limitedProfile = {
      name: formattedProfile.name,
      email: formattedProfile.email,
      profilePicture: formattedProfile.profilePicture,
    };
    res.json({ success: true, profile: limitedProfile });
  } catch (error) {
    console.error("[getProfileByUuid] Internal Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 자신의 프로필 정보 업데이트 (이름 및 프로필 사진)
exports.updateProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const { name } = req.body;

    // 이름 유효성 검사
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.message || "유효하지 않은 이름입니다.",
      });
    }

    // 프로필 사진 첨부시 처리
    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = await saveProfilePicture(uuid, req.file);
    }

    const updateData = { name };
    if (profilePicturePath) {
      updateData.profilePicture = profilePicturePath;
    }

    // 업데이트 실행
    const updatedProfile = await userModel.updateUserProfile(uuid, updateData);
    if (!updatedProfile) {
      return res.status(400).json({ success: false, message: "프로필 업데이트에 실패했습니다." });
    }

    res.json({ success: true, profile: formatProfile(updatedProfile) });
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};
