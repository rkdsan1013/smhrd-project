const db = require("../config/db");
const chatQueries = require("./chatQueries");
const chatTransactions = require("./chatTransactions");
const { v4: uuidv4 } = require("uuid");

/**
 * DM 채팅방을 조회하거나 생성합니다.
 * 두 사용자의 UUID를 정렬한 후 기존 DM 채팅방이 있으면 반환하고,
 * 없으면 새로 생성합니다.
 */
exports.getOrCreateDMRoom = async (userUuid, friendUuid) => {
  const [uuid1, uuid2] = [userUuid, friendUuid].sort();
  const [existingRoom] = await db.query(chatQueries.findDMRoom, [uuid1, uuid2, uuid1, uuid2]);
  if (existingRoom && existingRoom.length > 0) {
    return existingRoom[0].uuid;
  }
  const roomUuid = await chatTransactions.createDMRoomWithMembers(uuid1, uuid2);
  return roomUuid;
};

/**
 * 특정 채팅방에 메시지를 저장하고,
 * 저장된 메시지와 전송자 정보를 반환합니다.
 */
exports.saveMessage = async (roomUuid, senderUuid, message) => {
  const messageUuid = uuidv4();
  await db.query(chatQueries.insertMessage, [messageUuid, roomUuid, senderUuid, message]);
  const [rows] = await db.query(chatQueries.getMessageWithSender, [messageUuid]);

  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (rows[0]?.sender_picture) {
    rows[0].sender_picture = `${serverUrl}${rows[0].sender_picture}`;
  }

  return rows[0];
};

/**
 * 채팅방 내의 메시지들을 전송시각 순으로 조회합니다.
 */
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

/**
 * 일정 시간 이후 회원 탈퇴 등으로 남은 1인짜리 DM 채팅방들을 삭제합니다.
 */
exports.cleanupLonelyDMRooms = async () => {
  await chatTransactions.deleteLonelyDMRooms();
};

/**
 * 그룹 채팅방 조회
 * 그룹에 연결된 채팅방(즉, chat_rooms 테이블에서 type이 'group'이고 group_uuid가 일치하는)을 조회하여 반환합니다.
 */
exports.getGroupChatRoomByGroupUuid = async (groupUuid) => {
  const [rows] = await db.query(
    "SELECT uuid FROM chat_rooms WHERE type = 'group' AND group_uuid = ?",
    [groupUuid],
  );
  return rows[0]; // 조회 결과가 없으면 undefined 반환
};
