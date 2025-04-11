// /backend/src/models/groupModel.js

const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");
const friendModel = require("./friendModel");

// 그룹 단건 조회: uuid를 기준으로 그룹 정보를 조회
const getGroupByUuid = async (groupUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
  return rows[0];
};

// 그룹 이미지 업데이트: 그룹 아이콘, 그룹 사진 URL 업데이트
const updateGroupImages = async (groupUuid, groupIconUrl, groupPictureUrl) => {
  const [result] = await pool.query(groupQueries.UPDATE_GROUP_IMAGES, [
    groupIconUrl,
    groupPictureUrl,
    groupUuid,
  ]);
  return result;
};

// 내 그룹 목록 조회: 사용자가 가입한 그룹 조회
const getMyGroups = async (userUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
  return rows;
};

// 그룹 검색: 그룹 이름에 키워드 포함 여부로 검색
const searchGroups = async (name) => {
  const [rows] = await pool.query(groupQueries.SEARCH_GROUPS_BY_NAME, [`%${name}%`]);
  return rows;
};

// 그룹 생성: 그룹 생성 트랜잭션을 통해 그룹 생성 (DB에서 자동 생성된 uuid 사용)
const createGroup = async (
  name,
  description,
  visibility,
  groupLeaderUuid,
  groupIconUrl,
  groupPictureUrl,
) => {
  return await groupTransactions.createGroup(
    pool,
    name,
    description,
    visibility,
    groupLeaderUuid,
    groupIconUrl,
    groupPictureUrl,
  );
};

// 그룹 멤버 조회: group_members와 user_profiles 조인하여 멤버 정보 반환
const getGroupMembers = async (groupUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUP_MEMBERS, [groupUuid]);
  return rows;
};

/**
 * 그룹 초대 생성 함수
 * 테이블 구조에 맞춰, invited_user_uuid 컬럼을 기준으로 중복 초대를 체크하고,
 * 없으면 INSERT 후 생성된 uuid를 반환합니다.
 */
const sendGroupInvite = async (groupUuid, inviterUuid, invitedUserUuid) => {
  // 중복 초대 체크: 같은 그룹에서 같은 초대자가 같은 대상에게 보낸 초대가 있는지 확인
  const [existing] = await pool.query(
    "SELECT * FROM group_invites WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?",
    [groupUuid, inviterUuid, invitedUserUuid],
  );
  if (existing.length > 0) {
    return existing[0].uuid;
  }
  // 새 초대 생성
  await pool.query(
    "INSERT INTO group_invites (group_uuid, invited_by_uuid, invited_user_uuid) VALUES (?, ?, ?)",
    [groupUuid, inviterUuid, invitedUserUuid],
  );
  // 생성된 초대의 uuid 조회 및 반환
  const [rows] = await pool.query(
    "SELECT uuid FROM group_invites WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?",
    [groupUuid, inviterUuid, invitedUserUuid],
  );
  return rows[0].uuid;
};

const getSentInvitesByGroupAndSender = async (groupUuid, invitedByUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_SENT_GROUP_INVITES, [
    groupUuid,
    invitedByUuid,
  ]);
  return rows;
};

const getReceivedInvitesByUserUuid = async (userUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_RECEIVED_GROUP_INVITES, [userUuid]);
  return rows;
};

module.exports = {
  getGroupByUuid,
  updateGroupImages,
  getMyGroups,
  createGroup,
  searchGroups,
  getGroupMembers,
  sendGroupInvite, // 수정된 함수 내보내기
  getSentInvitesByGroupAndSender,
  getReceivedInvitesByUserUuid,
};
