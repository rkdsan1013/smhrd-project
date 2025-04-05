// /backend/src/utils/imageHelper.js

const path = require("path");
const fs = require("fs");

// 공통 함수: 지정한 폴더가 없으면 생성
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// 공통 함수: 파일 저장
// uploadDir: 실제 파일이 저장될 절대경로
// relativePath: 웹에서 접근할 수 있는 경로 (예: "/uploads/profile_pictures")
// uuid, file: 저장에 필요한 정보
// defaultExtension: 기본 파일 확장자 (없을 경우 "webp" 사용)
const saveFile = async (uploadDir, relativePath, uuid, file, defaultExtension = "webp") => {
  ensureDirectoryExists(uploadDir);
  const fileExtension = file.convertedExtension || defaultExtension;
  const fileName = `${uuid}.${fileExtension}`;
  const destPath = path.join(uploadDir, fileName);
  await fs.promises.writeFile(destPath, file.buffer);
  // 상대 URL 경로 반환 (윈도우의 경우 경로 구분자를 '/'로 변경)
  return path.join(relativePath, fileName).replace(/\\/g, "/");
};

// 공통 함수: 파일 삭제
// uploadDir: 파일이 저장된 디렉토리
// uuid, fileExtension: 파일명을 결정하기 위한 정보
const deleteFile = async (uploadDir, uuid, fileExtension = "webp") => {
  const fileName = `${uuid}.${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);
  try {
    await fs.promises.unlink(filePath);
    console.log("파일 삭제 완료:", filePath);
  } catch (err) {
    console.error("파일 삭제 오류:", err);
  }
};

// 프로필 사진 관련 함수
const saveProfilePicture = async (uuid, file) => {
  const uploadDir = path.join(__dirname, "../../uploads/profile_pictures");
  return await saveFile(uploadDir, "/uploads/profile_pictures", uuid, file);
};

const deleteProfilePicture = async (uuid, fileExtension = "webp") => {
  const uploadDir = path.join(__dirname, "../../uploads/profile_pictures");
  await deleteFile(uploadDir, uuid, fileExtension);
};

// 그룹 아이콘 관련 함수
const saveGroupIcon = async (uuid, file) => {
  const uploadDir = path.join(__dirname, "../../uploads/group_icons");
  return await saveFile(uploadDir, "/uploads/group_icons", uuid, file);
};

const deleteGroupIcon = async (uuid, fileExtension = "webp") => {
  const uploadDir = path.join(__dirname, "../../uploads/group_icons");
  await deleteFile(uploadDir, uuid, fileExtension);
};

// 그룹 이미지 관련 함수
const saveGroupPicture = async (uuid, file) => {
  const uploadDir = path.join(__dirname, "../../uploads/group_pictures");
  return await saveFile(uploadDir, "/uploads/group_pictures", uuid, file);
};

const deleteGroupPicture = async (uuid, fileExtension = "webp") => {
  const uploadDir = path.join(__dirname, "../../uploads/group_pictures");
  await deleteFile(uploadDir, uuid, fileExtension);
};

module.exports = {
  saveProfilePicture,
  deleteProfilePicture,
  saveGroupIcon,
  deleteGroupIcon,
  saveGroupPicture,
  deleteGroupPicture,
};
