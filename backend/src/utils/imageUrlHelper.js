// /backend/src/utils/imageUrlHelper.js

const serverUrl = process.env.SERVER_URL || "http://localhost:5000";

// 이미지 URL이 절대 URL인지 확인
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

// 파일 경로에 서버 URL을 접두어로 붙여 절대 URL로 변환
const formatImageUrl = (filePath) => {
  if (!filePath || isAbsoluteUrl(filePath)) return filePath;
  return serverUrl + filePath;
};

module.exports = {
  formatImageUrl,
};
