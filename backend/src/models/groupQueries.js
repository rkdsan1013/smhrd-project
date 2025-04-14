const INSERT_GROUP_INFO = `
  INSERT INTO group_info
    (name, description, group_icon, group_picture, visibility, group_leader_uuid)
  VALUES
    (?, ?, ?, ?, ?, ?)
`;

const INSERT_GROUP_MEMBER = `
  INSERT INTO group_members (group_uuid, user_uuid, role)
  VALUES (?, ?, 'leader')
`;

const SELECT_GROUP_BY_UUID = `
  SELECT * FROM group_info WHERE uuid = ?
`;

const SELECT_LATEST_GROUP_BY_LEADER = `
  SELECT * FROM group_info
  WHERE group_leader_uuid = ?
  ORDER BY created_at DESC
  LIMIT 1
`;

const UPDATE_GROUP_IMAGES = `
  UPDATE group_info
  SET group_icon = ?, group_picture = ?
  WHERE uuid = ?
`;

const SELECT_GROUPS_FOR_MEMBER = `
  SELECT gi.*
  FROM group_info gi
  JOIN group_members gm ON gi.uuid = gm.group_uuid
  WHERE gm.user_uuid = ?
  ORDER BY gi.created_at DESC
`;

const SEARCH_GROUPS_BY_NAME = `
  SELECT * FROM group_info
  WHERE name LIKE ? AND visibility = 'public'
  ORDER BY created_at DESC
`;

const SELECT_GROUP_INVITE_BY_UUID = `
  SELECT * FROM group_invites
  WHERE uuid = ? AND invited_user_uuid = ?
`;

const DELETE_GROUP_INVITE_BY_UUID = `
  DELETE FROM group_invites
  WHERE uuid = ?
`;

const INSERT_GROUP_MEMBER_FROM_INVITE = `
  INSERT INTO group_members (group_uuid, user_uuid, role)
  VALUES (?, ?, 'member')
`;

const INSERT_GROUP_INVITE = `
  INSERT INTO group_invites (group_uuid, invited_by_uuid, invited_user_uuid)
  VALUES (?, ?, ?)
`;

const SELECT_LATEST_INVITE_UUID = `
  SELECT uuid
  FROM group_invites
  WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?
  ORDER BY invited_at DESC
  LIMIT 1
`;

const DELETE_ALL_INVITES_FOR_GROUP_AND_USER = `
  DELETE FROM group_invites
  WHERE group_uuid = ? AND invited_user_uuid = ?
`;

const CHECK_DUPLICATE_INVITE = `
  SELECT uuid FROM group_invites
  WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?
  LIMIT 1
`;

const CHECK_IS_GROUP_MEMBER = `
  SELECT 1 FROM group_members
  WHERE group_uuid = ? AND user_uuid = ?
  LIMIT 1
`;

const SELECT_GROUP_MEMBERS = `
  SELECT 
    up.uuid, 
    up.name, 
    up.profile_picture AS profilePicture
  FROM group_members AS gm
  JOIN user_profiles AS up ON gm.user_uuid = up.uuid
  WHERE gm.group_uuid = ?
`;

const SELECT_SENT_GROUP_INVITES = `
  SELECT uuid AS inviteUuid, invited_user_uuid AS invitedUserUuid
  FROM group_invites
  WHERE group_uuid = ? AND invited_by_uuid = ?
`;

const SELECT_RECEIVED_GROUP_INVITES = `
  SELECT
    gi.uuid AS inviteUuid,
    gi.group_uuid AS groupUuid,
    gi.invited_by_uuid AS inviterUuid,
    up.name AS inviterName,
    g.name AS groupName
  FROM group_invites gi
  JOIN user_profiles up ON gi.invited_by_uuid = up.uuid
  JOIN group_info g ON gi.group_uuid = g.uuid
  WHERE gi.invited_user_uuid = ?
`;

const SELECT_LATEST_GROUP_UUID = `
  SELECT uuid
  FROM group_info
  ORDER BY created_at DESC
  LIMIT 1
`;

const INSERT_GROUP_SURVEY = `
  INSERT INTO group_surveys (uuid, group_uuid, activity_type, budget_type, trip_duration)
  VALUES (UUID(), ?, ?, ?, ?)
`;

// 공지사항 삽입
const INSERT_ANNOUNCEMENT = `
  INSERT INTO announcements (uuid, group_uuid, author_uuid, title, content)
  VALUES (UUID(), ?, ?, ?, ?)
`;

const UPDATE_ANNOUNCEMENT = `
  UPDATE announcements
  SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
  WHERE uuid = ? AND group_uuid = ?
`;

const DELETE_ANNOUNCEMENT = `
  DELETE FROM announcements
  WHERE uuid = ? AND group_uuid = ?
`;

// 공지사항 조회
const SELECT_ANNOUNCEMENTS_BY_GROUP = `
  SELECT 
    a.uuid, 
    a.title, 
    a.content, 
    a.created_at, 
    a.updated_at, 
    COALESCE(up.name, 'Unknown') AS author_name
  FROM announcements a
  LEFT JOIN user_profiles up ON a.author_uuid = up.uuid
  WHERE a.group_uuid = ?
  ORDER BY a.created_at DESC
`;

module.exports = {
  INSERT_GROUP_INFO,
  INSERT_GROUP_MEMBER,
  SELECT_GROUP_BY_UUID,
  SELECT_LATEST_GROUP_BY_LEADER,
  UPDATE_GROUP_IMAGES,
  SELECT_GROUPS_FOR_MEMBER,
  SEARCH_GROUPS_BY_NAME,
  SELECT_GROUP_INVITE_BY_UUID,
  DELETE_GROUP_INVITE_BY_UUID,
  DELETE_ALL_INVITES_FOR_GROUP_AND_USER,
  INSERT_GROUP_MEMBER_FROM_INVITE,
  INSERT_GROUP_INVITE,
  SELECT_LATEST_INVITE_UUID,
  CHECK_DUPLICATE_INVITE,
  CHECK_IS_GROUP_MEMBER,
  SELECT_GROUP_MEMBERS,
  SELECT_SENT_GROUP_INVITES,
  SELECT_RECEIVED_GROUP_INVITES,
  SELECT_LATEST_GROUP_UUID,
  INSERT_GROUP_SURVEY,
  INSERT_ANNOUNCEMENT,
  SELECT_ANNOUNCEMENTS_BY_GROUP,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
};
