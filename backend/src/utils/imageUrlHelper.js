// /backend/src/utils/imageUrlHelper.js

const serverUrl = process.env.SERVER_URL || "http://localhost:5000";

// 이미지 URL이 이미 절대 URL인지 확인하는 헬퍼 함수
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

// 저장된 이미지 파일 경로에 서버 URL을 접두어로 붙여 절대 URL로 변환
const formatImageUrl = (filePath) => {
  if (!filePath || isAbsoluteUrl(filePath)) return filePath;
  return serverUrl + filePath;
};

module.exports = {
  formatImageUrl,
};
