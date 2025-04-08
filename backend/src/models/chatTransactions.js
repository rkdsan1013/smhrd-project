const db = require("../config/db");
const chatQueries = require("./chatQueries");
const { v4: uuidv4 } = require("uuid");

/**
 * 그룹 채팅방 생성 트랜잭션
 * - chat_rooms 테이블에 그룹 채팅방을 생성 (type: 'group', group_uuid를 지정)
 * - chat_room_members 테이블에 그룹 리더(생성자)를 기본 회원으로 추가합니다.
 */
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

/**
 * DM 채팅방 생성 트랜잭션
 * - chat_rooms 테이블에 DM 채팅방을 생성
 * - chat_room_members 테이블에 두 사용자를 모두 추가합니다.
 */
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

/**
 * 회원 탈퇴나 기타 사유로 인해 DM 채팅방에 단 한 명만 남은 경우,
 * 해당 채팅방을 삭제하는 함수입니다.
 */
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
