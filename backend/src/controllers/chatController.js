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

exports.getMessagesByRoom = async (req, res) => {
  try {
    const { roomUuid } = req.params;
    if (!roomUuid) {
      return res.status(400).json({ success: false, message: "roomUuid가 필요합니다." });
    }

    const messages = await chatModel.getMessagesByRoom(roomUuid);
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("채팅 메시지 불러오기 오류:", err);
    return res.status(500).json({ success: false, message: "메시지 불러오기 실패" });
  }
};
