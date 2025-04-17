// /backend/src/models/chatModel.js

const db = require("../config/db");
const chatQueries = require("./chatQueries");
const chatTransactions = require("./chatTransactions");
const { v4: uuidv4 } = require("uuid");

// DM 채팅방 조회 또는 생성
// 두 사용자의 UUID를 정렬하여 기존 DM 방이 있으면 반환, 없으면 새로 생성
exports.getOrCreateDMRoom = async (userUuid, friendUuid) => {
  const [uuid1, uuid2] = [userUuid, friendUuid].sort();
  const [existingRoom] = await db.query(chatQueries.findDMRoom, [uuid1, uuid2, uuid1, uuid2]);
  if (existingRoom && existingRoom.length > 0) {
    return existingRoom[0].uuid;
  }
  const roomUuid = await chatTransactions.createDMRoomWithMembers(uuid1, uuid2);
  return roomUuid;
};

// 특정 채팅방에 메시지 저장 후, 전송자 정보 포함하여 반환
exports.saveMessage = async (roomUuid, senderUuid, message) => {
  const messageUuid = uuidv4();
  await db.query(chatQueries.insertMessage, [messageUuid, roomUuid, senderUuid, message]);
  const [rows] = await db.query(chatQueries.getMessageWithSender, [messageUuid]);
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (rows[0] && rows[0].sender_picture) {
    rows[0].sender_picture = `${serverUrl}${rows[0].sender_picture}`;
  }
  return rows[0];
};

// 채팅방 내 메시지들을 전송시각 순으로 조회
exports.getMessagesByRoom = async (roomUuid) => {
  const [rows] = await db.query(chatQueries.getMessagesWithSenderByRoom, [roomUuid]);
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  return rows.map((msg) => {
    if (msg.sender_picture) {
      msg.sender_picture = `${serverUrl}${msg.sender_picture}`;
    }
    return msg;
  });
};

// 일정 시간 후 회원 탈퇴 등으로 남은 1인 DM 채팅방 삭제
exports.cleanupLonelyDMRooms = async () => {
  await chatTransactions.deleteLonelyDMRooms();
};

// 그룹 채팅방 조회
// chat_rooms 테이블에서 type이 'group'이고 group_uuid가 일치하는 방 조회
exports.getGroupChatRoomByGroupUuid = async (groupUuid) => {
  const [rows] = await db.query(
    "SELECT uuid FROM chat_rooms WHERE type = 'group' AND group_uuid = ?",
    [groupUuid],
  );
  return rows[0]; // 조회 결과 없으면 undefined 반환
};
