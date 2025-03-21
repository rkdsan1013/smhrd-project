// /backend/src/middlewares/uploadImage.js
const multer = require("multer");
const sharp = require("sharp");

// 메모리 스토리지를 사용하여 업로드 파일을 메모리에 저장
const storage = multer.memoryStorage();

// 이미지 파일만 허용하는 fileFilter 설정
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  // 에러 발생: 이미지 파일이 아닌 경우
  cb(new Error("오직 이미지 파일만 업로드할 수 있습니다."), false);
};

// multer 업로드 인스턴스 생성 (10MB로 파일 크기 제한 추가)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기를 10MB로 제한
});

/**
 * 미들웨어: 업로드된 이미지를 처리하여
 * 1. EXIF 정보를 기반으로 자동 회전
 * 2. 512x512 크기로 리사이즈 및 가운데 기준 crop
 * 3. webp 포맷으로 변환 (확장자를 webp로 통일)
 *
 * 이미지가 없으면 그냥 다음 단계로 넘어갑니다.
 */
async function resizeImage(req, res, next) {
  if (!req.file) return next(); // 파일이 없는 경우 다음으로 넘어감

  try {
    const resizedBuffer = await sharp(req.file.buffer)
      .rotate() // EXIF 정보를 기반으로 자동 회전
      .resize(512, 512, {
        fit: "cover", // 목표 크기를 완전히 채우도록 비율에 따라 자르기
        position: "center", // 가운데 기준으로 crop
      })
      .toFormat("webp") // webp 형식으로 변환
      .toBuffer();

    req.file.buffer = resizedBuffer;
    // 나중에 컨트롤러에서 저장할 때 사용할 확장자를 지정
    req.file.convertedExtension = "webp";
    next();
  } catch (error) {
    next(error); // 에러 발생 시 처리
  }
}

module.exports = { upload, resizeImage };
