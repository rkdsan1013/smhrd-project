// /backend/src/utils/imageHelper.js
const path = require("path");
const fs = require("fs");

const saveProfilePicture = async (userId, file) => {
  const uploadsDir = path.join(__dirname, "../../uploads/profile_pictures");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const fileExtension = file.convertedExtension || "webp";
  const fileName = `${userId}.${fileExtension}`;
  const destPath = path.join(uploadsDir, fileName);
  await fs.promises.writeFile(destPath, file.buffer);
  return `/uploads/profile_pictures/${fileName}`;
};

module.exports = { saveProfilePicture };
