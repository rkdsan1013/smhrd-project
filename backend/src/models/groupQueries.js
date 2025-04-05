// /backend/src/models/groupQueries.js

// 그룹 정보를 삽입할 때, uuid는 DB에서 DEFAULT (UUID())로 자동 생성됩니다.
const INSERT_GROUP_INFO = `
  INSERT INTO group_info
    (name, description, group_icon, group_picture, visibility, group_leader_uuid)
  VALUES
    (?, ?, ?, ?, ?, ?)
`;

// 그룹 멤버에 그룹 리더 등록 (role은 'leader'로 고정)
const INSERT_GROUP_MEMBER = `
  INSERT INTO group_members (group_uuid, user_uuid, role)
  VALUES (?, ?, 'leader')
`;

// 그룹 단건 조회 (uuid 기준)
const SELECT_GROUP_BY_UUID = `
  SELECT * FROM group_info WHERE uuid = ?
`;

// 그룹 리더별 가장 최근 생성된 그룹 조회
// 그룹 생성 후, 해당 그룹 리더가 생성한 그룹 중 가장 최신 그룹을 선택합니다.
const SELECT_LATEST_GROUP_BY_LEADER = `
  SELECT * FROM group_info
  WHERE group_leader_uuid = ?
  ORDER BY created_at DESC
  LIMIT 1
`;

// 그룹 이미지 업데이트: 그룹 아이콘과 그룹 사진 컬럼 수정
const UPDATE_GROUP_IMAGES = `
  UPDATE group_info
  SET group_icon = ?, group_picture = ?
  WHERE uuid = ?
`;

// 내가 가입한 그룹 목록 조회
// group_info와 group_members 테이블을 조인하여 특정 사용자가 속한 그룹을 조회합니다.
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
  SELECT_LATEST_GROUP_BY_LEADER,
  UPDATE_GROUP_IMAGES,
  SELECT_GROUPS_FOR_MEMBER,
};
