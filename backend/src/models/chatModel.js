// backend/src/models/chatModel.js
const db = require("../config/db");
const chatQueries = require("./chatQueries");
const chatTransactions = require("./chatTransactions");
const { v4: uuidv4 } = require("uuid");

// 두 사용자 간 DM 채팅방 조회 또는 생성
exports.getOrCreateDMRoom = async (userUuid, friendUuid) => {
  // uuid 정렬하여 일관된 순서로 검색 (중복 생성을 방지)
  const [uuid1, uuid2] = [userUuid, friendUuid].sort();
  const [existingRoom] = await db.query(chatQueries.findDMRoom, [uuid1, uuid2, uuid1, uuid2]);
  if (existingRoom && existingRoom.length > 0) {
    return existingRoom[0].uuid;
  }
  const roomUuid = await chatTransactions.createDMRoomWithMembers(uuid1, uuid2);
  return roomUuid;
};

// 메시지 저장: 미리 생성한 messageUuid를 사용하여 INSERT 후 조회
exports.saveMessage = async (roomUuid, senderUuid, message) => {
  const messageUuid = uuidv4();
  await db.query(chatQueries.insertMessage, [messageUuid, roomUuid, senderUuid, message]);
  const [rows] = await db.query(chatQueries.getMessageById, [messageUuid]);
  return rows[0];
};

// 채팅 메시지 조회
exports.getMessagesByRoom = async (roomUuid) => {
  const [rows] = await db.query(chatQueries.getMessagesByRoom, [roomUuid]);
  return rows;
};
