// /backend/src/models/chatTransactions.js

const db = require("../config/db"); // DB 연결
const chatQueries = require("./chatQueries"); // 채팅 SQL 쿼리
const { v4: uuidv4 } = require("uuid");

// 그룹 채팅방 생성 트랜잭션
// chat_rooms에 그룹 채팅방 생성 후, chat_room_members에 그룹 리더 추가
exports.createGroupRoomWithLeader = async (groupUuid, leaderUuid) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const roomUuid = uuidv4();
    await conn.query("INSERT INTO chat_rooms (uuid, type, group_uuid) VALUES (?, 'group', ?)", [
      roomUuid,
      groupUuid,
    ]);
    await conn.query(chatQueries.addUserToRoom, [roomUuid, leaderUuid]);
    await conn.commit();
    return roomUuid;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// DM 채팅방 생성 트랜잭션
// chat_rooms에 DM 채팅방 생성 후, chat_room_members에 두 사용자 추가
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

// DM 채팅방 정리 트랜잭션
// 1인 남은 DM 채팅방 삭제
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
