// /backend/src/controllers/chatController.js

const chatModel = require("../models/chatModel");

// DM 채팅방 조회 또는 생성
exports.openOrCreateDMRoom = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const { friendUuid } = req.body;
    if (!friendUuid) {
      return res.status(400).json({ success: false, message: "friendUuid가 필요합니다." });
    }
    const roomUuid = await chatModel.getOrCreateDMRoom(userUuid, friendUuid);
    return res.status(200).json({ success: true, roomUuid });
  } catch (err) {
    console.error("DM 채팅방 생성 오류:", err);
    return res.status(500).json({ success: false, message: "DM 채팅방 생성 오류" });
  }
};

// 메시지 목록 조회 (프로필 포함)
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

// 사용자 탈퇴 시 DM 방 정리
exports.cleanUpDMRooms = async (req, res) => {
  try {
    await chatModel.deleteDMRoomsWithOneMember();
    return res.status(200).json({ success: true, message: "1인 남은 DM방 정리 완료" });
  } catch (err) {
    console.error("DM 방 정리 오류:", err);
    return res.status(500).json({ success: false, message: "DM 방 정리 중 오류" });
  }
};
