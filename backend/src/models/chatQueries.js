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

const addUserToRoom = `
  INSERT INTO chat_room_members (room_uuid, user_uuid)
  VALUES (?, ?)
`;

const getMessagesByRoom = `
  SELECT uuid, room_uuid, sender_uuid, message, sent_at
  FROM chat_messages
  WHERE room_uuid = ?
  ORDER BY sent_at ASC
`;

module.exports = {
  findDMRoom,
  insertMessage,
  getMessageById,
  addUserToRoom,
  getMessagesByRoom,
};
