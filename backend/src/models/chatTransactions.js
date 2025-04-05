// backend/src/models/chatTransactions.js

const db = require("../config/db");
const chatQueries = require("./chatQueries");
const { v4: uuidv4 } = require("uuid");

// DM 채팅방 생성 트랜잭션
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

// ✅ 회원 탈퇴 후 1명만 남은 DM 채팅방 삭제
exports.deleteLonelyDMRooms = async () => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rooms] = await conn.query(chatQueries.findLonelyDMRooms);

    if (rooms.length > 0) {
      const roomUuids = rooms.map((r) => r.uuid);
      await conn.query(chatQueries.deleteChatRoom, [roomUuids]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
