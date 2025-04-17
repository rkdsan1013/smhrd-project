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

// multer 업로드 인스턴스 생성 (파일 크기 제한: 10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 업로드된 이미지 자동 회전, 512x512 리사이즈, 가운데 crop, webp 변환 처리 (단일 및 다중 파일 모두 적용)
async function resizeImage(req, res, next) {
  try {
    // 단일 파일 처리 (upload.single 사용 시)
    if (req.file) {
      const resizedBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize(512, 512, { fit: "cover", position: "center" })
        .toFormat("webp")
        .toBuffer();
      req.file.buffer = resizedBuffer;
      req.file.convertedExtension = "webp";
    }
    // 다중 파일 처리 (upload.fields 사용 시)
    if (req.files) {
      for (const key in req.files) {
        if (Array.isArray(req.files[key])) {
          for (let file of req.files[key]) {
            const resizedBuffer = await sharp(file.buffer)
              .rotate()
              .resize(512, 512, { fit: "cover", position: "center" })
              .toFormat("webp")
              .toBuffer();
            file.buffer = resizedBuffer;
            file.convertedExtension = "webp";
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, resizeImage };
