// backend/src/models/chatQueries.js

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

const insertMessage = `
  INSERT INTO chat_messages (uuid, room_uuid, sender_uuid, message)
  VALUES (?, ?, ?, ?)
`;

const getMessageById = `
  SELECT uuid, room_uuid, sender_uuid, message, sent_at
  FROM chat_messages
  WHERE uuid = ?
`;

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

const addUserToRoom = `
  INSERT INTO chat_room_members (room_uuid, user_uuid)
  VALUES (?, ?)
`;

const findLonelyDMRooms = `
  SELECT cr.uuid
  FROM chat_rooms cr
  JOIN chat_room_members crm ON cr.uuid = crm.room_uuid
  WHERE cr.type = 'dm'
  GROUP BY cr.uuid
  HAVING COUNT(crm.user_uuid) = 1
`;

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
