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

// 그룹 이름으로 검색
const SEARCH_GROUPS_BY_NAME = `
  SELECT * FROM group_info
  WHERE name LIKE ? AND visibility = 'public'
  ORDER BY created_at DESC
`;
// 그룹 초대장 생성
const SELECT_GROUP_INVITE_BY_UUID = `
  SELECT * FROM group_invites
  WHERE uuid = ? AND invited_user_uuid = ?
`;
// 그룹 초대장 삭제
const DELETE_GROUP_INVITE_BY_UUID = `
  DELETE FROM group_invites
  WHERE uuid = ?
`;
// 그룹 초대장 수락 시, 그룹 멤버 등록 (role은 'member'로 고정)
const INSERT_GROUP_MEMBER_FROM_INVITE = `
  INSERT INTO group_members (group_uuid, user_uuid, role)
  VALUES (?, ?, 'member')
`;
// 그룹 초대 생성 쿼리 추가
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
// 그룹 멤버 확인 쿼리
const CHECK_IS_GROUP_MEMBER = `
  SELECT 1 FROM group_members
  WHERE group_uuid = ? AND user_uuid = ?
  LIMIT 1
`;

// 그룹 멤버 조회: group_members 테이블과 user_profiles 테이블을 조인하여 멤버 정보를 조회
const SELECT_GROUP_MEMBERS = `
  SELECT 
    up.uuid, 
    up.name, 
    up.profile_picture AS profilePicture
  FROM group_members AS gm
  JOIN user_profiles AS up ON gm.user_uuid = up.uuid
  WHERE gm.group_uuid = ?
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
};
