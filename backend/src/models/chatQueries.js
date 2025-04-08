// /backend/src/models/chatQueries.js

// DM 채팅방 조회 쿼리: 두 사용자의 UUID를 기준으로 기존 DM 채팅방 조회
const findDMRoom = `
  SELECT cr.uuid
  FROM chat_rooms cr
  JOIN chat_room_members m1 ON cr.uuid = m1.room_uuid
  JOIN chat_room_members m2 ON cr.uuid = m2.room_uuid
  WHERE cr.type = 'dm'
    AND m1.user_uuid IN (?, ?)
    AND m2.user_uuid IN (?, ?)
  GROUP BY cr.uuid
  HAVING COUNT(DISTINCT m1.user_uuid) = 2
`;

// 메시지 삽입 쿼리
const insertMessage = `
  INSERT INTO chat_messages (uuid, room_uuid, sender_uuid, message)
  VALUES (?, ?, ?, ?)
`;

// 메시지 ID로 단일 메시지 조회 쿼리
const getMessageById = `
  SELECT uuid, room_uuid, sender_uuid, message, sent_at
  FROM chat_messages
  WHERE uuid = ?
`;

// 메시지와 전송자 정보 조회 쿼리
const getMessageWithSender = `
  SELECT 
    m.uuid,
    m.room_uuid,
    m.sender_uuid,
    m.message,
    m.sent_at,
    p.name AS sender_name,
    p.profile_picture AS sender_picture
  FROM chat_messages m
  JOIN user_profiles p ON m.sender_uuid = p.uuid
  WHERE m.uuid = ?
`;

// 채팅방 내 메시지 목록 조회 쿼리 (전송시각 순)
const getMessagesWithSenderByRoom = `
  SELECT 
    m.uuid,
    m.room_uuid,
    m.sender_uuid,
    m.message,
    m.sent_at,
    p.name AS sender_name,
    p.profile_picture AS sender_picture
  FROM chat_messages m
  JOIN user_profiles p ON m.sender_uuid = p.uuid
  WHERE m.room_uuid = ?
  ORDER BY m.sent_at ASC
`;

// 채팅방 멤버 추가 쿼리
const addUserToRoom = `
  INSERT INTO chat_room_members (room_uuid, user_uuid)
  VALUES (?, ?)
`;

// 1인 DM 채팅방 조회 쿼리: 회원 탈퇴 등으로 남은 채팅방
const findLonelyDMRooms = `
  SELECT cr.uuid
  FROM chat_rooms cr
  JOIN chat_room_members crm ON cr.uuid = crm.room_uuid
  WHERE cr.type = 'dm'
  GROUP BY cr.uuid
  HAVING COUNT(crm.user_uuid) = 1
`;

// 채팅방 삭제 쿼리
const deleteChatRoom = `
  DELETE FROM chat_rooms
  WHERE uuid IN (?)
`;

module.exports = {
  findDMRoom,
  insertMessage,
  getMessageById,
  getMessageWithSender,
  getMessagesWithSenderByRoom,
  addUserToRoom,
  findLonelyDMRooms,
  deleteChatRoom,
};
