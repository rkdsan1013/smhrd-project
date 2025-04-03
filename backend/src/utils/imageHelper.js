// /backend/src/utils/imageHelper.js
const path = require("path");
const fs = require("fs");

// 프로필 사진 저장: uploads/profile_pictures 폴더에 저장 후 파일 경로 반환
const saveProfilePicture = async (uuid, file) => {
  const uploadsDir = path.join(__dirname, "../../uploads/profile_pictures");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const fileExtension = file.convertedExtension || "webp";
  const fileName = `${uuid}.${fileExtension}`;
  const destPath = path.join(uploadsDir, fileName);
  await fs.promises.writeFile(destPath, file.buffer);
  return `/uploads/profile_pictures/${fileName}`;
};

// 프로필 사진 삭제: 주어진 uuid와 확장자에 따라 파일 삭제
const deleteProfilePicture = async (uuid, fileExtension = "webp") => {
  const uploadsDir = path.join(__dirname, "../../uploads/profile_pictures");
  const fileName = `${uuid}.${fileExtension}`;
  const absolutePath = path.join(uploadsDir, fileName);
  try {
    await fs.promises.unlink(absolutePath);
    console.log("프로필 사진 삭제 완료:", absolutePath);
  } catch (err) {
    console.error("프로필 사진 삭제 오류:", err);
  }
};

module.exports = {
  saveProfilePicture,
  deleteProfilePicture,
};
