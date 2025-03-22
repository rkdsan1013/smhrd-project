// /backend/src/middlewares/uploadImage.js
const multer = require("multer");
const sharp = require("sharp");

// 메모리 스토리지 사용: 파일을 메모리에 저장
const storage = multer.memoryStorage();

// 파일 필터: 이미지 파일만 허용
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  cb(new Error("오직 이미지 파일만 업로드할 수 있습니다."), false);
};

// multer 업로드 인스턴스 생성, 파일 크기 제한 10MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 업로드된 이미지를 처리: 자동 회전, 512x512 리사이즈 및 가운데 crop, webp 변환
async function resizeImage(req, res, next) {
  if (!req.file) return next();
  try {
    const resizedBuffer = await sharp(req.file.buffer)
      .rotate() // EXIF 정보 기반 자동 회전
      .resize(512, 512, { fit: "cover", position: "center" }) // 512x512, 가운데 crop
      .toFormat("webp") // webp 포맷 변환
      .toBuffer();
    req.file.buffer = resizedBuffer;
    req.file.convertedExtension = "webp"; // 파일 확장자 지정
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, resizeImage };
