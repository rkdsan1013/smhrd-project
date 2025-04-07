// /backend/src/controllers/userController.js

const userModel = require("../models/userModel");
const { saveProfilePicture } = require("../utils/imageHelper");
const { validateUpdateProfile } = require("../utils/validators");
const { formatImageUrl } = require("../utils/imageUrlHelper");
const { normalizeName } = require("../utils/normalize");

// 프로필 정보 내에 profilePicture가 있을 경우, 이미지 URL 포매팅 적용
const formatProfile = (profile) => {
  if (profile.profilePicture) {
    profile.profilePicture = formatImageUrl(profile.profilePicture);
  }
  return profile;
};

// 자신의 프로필 조회 (전체 정보 반환)
exports.getProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const profile = await userModel.getProfileByUuid(uuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: "프로필 정보를 찾을 수 없습니다." });
    }
    return res.json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
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
    return res.json({ success: true, profile: limitedProfile });
  } catch (error) {
    console.error("[getProfileByUuid] Internal Error:", error);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 자신의 프로필 정보 업데이트 (이름 및 프로필 사진)
exports.updateProfile = async (req, res) => {
  try {
    const { uuid } = req.user;
    const { name: updatedName } = req.body;

    // DB에서 현재 사용자 프로필 정보를 조회하여 기존 이름을 획득합니다.
    const currentProfile = await userModel.getProfileByUuid(uuid);
    if (!currentProfile) {
      return res
        .status(404)
        .json({ success: false, message: "사용자 프로필 정보를 찾을 수 없습니다." });
    }
    const originalName = currentProfile.name;

    // 프로필 업데이트 검증: 새 이름과 프로필 사진의 변경 여부를 확인
    const updateValidation = validateUpdateProfile(originalName, updatedName, req.file);
    if (!updateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: updateValidation.message || "변경된 내용이 없습니다.",
      });
    }

    // 새 이름 정규화 (불필요한 공백 제거 등)
    const normalizedName = normalizeName(updatedName);

    // 프로필 사진 첨부 시 처리 (첨부된 이미지가 있다면 서버에 저장 후 경로 반환)
    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = await saveProfilePicture(uuid, req.file);
    }

    const updateData = { name: normalizedName };
    if (profilePicturePath) {
      updateData.profilePicture = profilePicturePath;
    }

    // DB에서 프로필 업데이트 수행 (동적 필드 업데이트)
    const updatedProfile = await userModel.updateUserProfile(uuid, updateData);
    if (!updatedProfile) {
      return res.status(400).json({ success: false, message: "프로필 업데이트에 실패했습니다." });
    }

    return res.json({ success: true, profile: formatProfile(updatedProfile) });
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 🔹 상대방 프로필 + 친구 상태 포함 조회
exports.getProfileWithFriendStatus = async (req, res) => {
  try {
    const currentUuid = req.user.uuid;
    const targetUuid = req.params.uuid;

    if (!targetUuid) {
      return res.status(400).json({ success: false, message: "유효한 uuid를 제공해주세요." });
    }

    const profile = await userModel.getProfileWithFriendStatus(currentUuid, targetUuid);
    if (!profile) {
      return res.status(404).json({ success: false, message: "프로필 정보를 찾을 수 없습니다." });
    }

    const formatted = {
      name: profile.name,
      email: profile.email,
      profilePicture: profile.profilePicture ? formatImageUrl(profile.profilePicture) : null,
      friendStatus: profile.friendStatus,
      friendRequester: profile.friendRequester,
    };

    return res.json({ success: true, profile: formatted });
  } catch (error) {
    console.error("[getProfileWithFriendStatus] Error:", error);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};
