const db = require("../config/db");
const chatQueries = require("./chatQueries");
const chatTransactions = require("./chatTransactions");
const { v4: uuidv4 } = require("uuid");

// DM 채팅방 조회 또는 생성
exports.getOrCreateDMRoom = async (userUuid, friendUuid) => {
  const [uuid1, uuid2] = [userUuid, friendUuid].sort();
  const [existingRoom] = await db.query(chatQueries.findDMRoom, [uuid1, uuid2, uuid1, uuid2]);
  if (existingRoom && existingRoom.length > 0) {
    return existingRoom[0].uuid;
  }
  const roomUuid = await chatTransactions.createDMRoomWithMembers(uuid1, uuid2);
  return roomUuid;
};

// ✅ 메시지 저장 후 사용자 프로필 포함된 메시지 반환
exports.saveMessage = async (roomUuid, senderUuid, message) => {
  const messageUuid = uuidv4();
  await db.query(chatQueries.insertMessage, [messageUuid, roomUuid, senderUuid, message]);
  const [rows] = await db.query(chatQueries.getMessageWithSender, [messageUuid]);

  // ✅ 프로필 이미지 경로 처리
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (rows[0]?.sender_picture) {
    rows[0].sender_picture = `${serverUrl}${rows[0].sender_picture}`;
  }

  return rows[0];
};

// ✅ 메시지 목록 (프로필 포함) 조회
exports.getMessagesByRoom = async (roomUuid) => {
  const [rows] = await db.query(chatQueries.getMessagesWithSenderByRoom, [roomUuid]);

  // ✅ 프로필 이미지 경로 처리
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  return rows.map((msg) => {
    if (msg.sender_picture) {
      msg.sender_picture = `${serverUrl}${msg.sender_picture}`;
    }
    return msg;
  });
};
