// /backend/src/models/groupQueries.js

// 그룹 정보를 삽입
const INSERT_GROUP_INFO = `
  INSERT INTO group_info
    (uuid, name, description, group_icon, group_picture, visibility, group_leader_uuid)
  VALUES
    (?, ?, ?, ?, ?, ?, ?)
`;

// 그룹 멤버에 그룹 리더 추가 (role: 'leader')
const INSERT_GROUP_MEMBER = `
  INSERT INTO group_members (group_uuid, user_uuid, role)
  VALUES (?, ?, 'leader')
`;

// 생성된 그룹 정보를 조회
const SELECT_GROUP_BY_UUID = `
  SELECT * FROM group_info WHERE uuid = ?
`;

// 내가 가입한 그룹 조회
const SELECT_GROUPS_FOR_MEMBER = `
  SELECT gi.*
  FROM group_info gi
  JOIN group_members gm ON gi.uuid = gm.group_uuid
  WHERE gm.user_uuid = ?
  ORDER BY gi.created_at DESC
`;

module.exports = {
  INSERT_GROUP_INFO,
  INSERT_GROUP_MEMBER,
  SELECT_GROUP_BY_UUID,
  SELECT_GROUPS_FOR_MEMBER,
};
