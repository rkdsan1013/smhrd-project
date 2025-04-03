// backend/src/controllers/chatController.js
const chatModel = require("../models/chatModel");

exports.openOrCreateDMRoom = async (req, res) => {
  try {
    const userUuid = req.user.uuid; // verifyToken 미들웨어에서 추가한 값
    const { friendUuid } = req.body;
    if (!friendUuid) {
      return res.status(400).json({ success: false, message: "friendUuid가 필요합니다." });
    }
    const roomUuid = await chatModel.getOrCreateDMRoom(userUuid, friendUuid);
    return res.status(200).json({ success: true, roomUuid });
  } catch (err) {
    console.error("Error in openOrCreateDMRoom:", err);
    return res.status(500).json({ success: false, message: "DM 채팅방 생성 오류" });
  }
};
