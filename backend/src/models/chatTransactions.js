// backend/src/models/chatTransactions.js
const db = require("../config/db");
const chatQueries = require("./chatQueries");
const { v4: uuidv4 } = require("uuid");

// 트랜잭션을 이용하여 DM 채팅방 및 멤버들을 생성
exports.createDMRoomWithMembers = async (uuid1, uuid2) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const roomUuid = uuidv4();
    await conn.query("INSERT INTO chat_rooms (uuid, type) VALUES (?, 'dm')", [roomUuid]);
    await conn.query(chatQueries.addUserToRoom, [roomUuid, uuid1]);
    await conn.query(chatQueries.addUserToRoom, [roomUuid, uuid2]);
    await conn.commit();
    return roomUuid;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
