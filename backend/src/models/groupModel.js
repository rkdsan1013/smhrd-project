// /backend/src/models/groupModel.js
// 그룹 모델: 그룹 조회, 생성, 초대 처리, 멤버 조회 등

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

// 초대 응답 처리: 초대 수락 또는 거절
const respondToGroupInvite = async (inviteUuid, userUuid, action) => {
  const [inviteRows] = await pool.query(groupQueries.SELECT_GROUP_INVITE_BY_UUID, [
    inviteUuid,
    userUuid,
  ]);

  if (!inviteRows.length) {
    throw new Error("유효하지 않은 초대이거나 권한이 없습니다.");
  }

  const invite = inviteRows[0];

  if (action === "accept") {
    // 초대 수락: 그룹 멤버 추가 후 모든 초대 삭제
    await pool.query(groupQueries.INSERT_GROUP_MEMBER_FROM_INVITE, [invite.group_uuid, userUuid]);
    await pool.query(groupQueries.DELETE_ALL_INVITES_FOR_GROUP_AND_USER, [
      invite.group_uuid,
      userUuid,
    ]);
  } else {
    // 초대 거절: 해당 초대 삭제
    await pool.query(groupQueries.DELETE_GROUP_INVITE_BY_UUID, [inviteUuid]);
  }

  return { success: true, action };
};

// 초대 전송: 중복 검사, 그룹 멤버 여부, 친구 여부 체크 후 초대 생성
const sendGroupInvite = async (groupUuid, inviterUuid, invitedUserUuid) => {
  // 1. 보내는 사람이 그룹 멤버인지 확인
  const [memberRows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [inviterUuid]);
  const isMember = memberRows.some((g) => g.uuid === groupUuid);
  if (!isMember) {
    throw new Error("해당 그룹의 멤버만 초대를 보낼 수 있습니다.");
  }

  // 2. 받는 사람이 이미 그룹의 멤버인지 확인
  const [isTargetMemberRows] = await pool.query(groupQueries.CHECK_IS_GROUP_MEMBER, [
    groupUuid,
    invitedUserUuid,
  ]);
  if (isTargetMemberRows.length > 0) {
    throw new Error("이미 그룹에 가입된 사용자입니다.");
  }

  // 3. 친구 관계 확인
  const status = await friendModel.checkFriendStatus(inviterUuid, invitedUserUuid);
  if (!status || status.status !== "accepted") {
    throw new Error("친구 관계가 아닌 사용자에게는 초대를 보낼 수 없습니다.");
  }

  // 4. 중복 초대 여부 확인
  const [duplicateRows] = await pool.query(groupQueries.CHECK_DUPLICATE_INVITE, [
    groupUuid,
    inviterUuid,
    invitedUserUuid,
  ]);
  if (duplicateRows.length > 0) {
    throw new Error("이미 같은 대상에게 초대를 보냈습니다.");
  }

  // 5. 초대 삽입
  await pool.query(groupQueries.INSERT_GROUP_INVITE, [groupUuid, inviterUuid, invitedUserUuid]);

  // 6. 최신 초대 UUID 반환
  const [rows] = await pool.query(groupQueries.SELECT_LATEST_INVITE_UUID, [
    groupUuid,
    inviterUuid,
    invitedUserUuid,
  ]);
  if (!rows.length) {
    throw new Error("초대 UUID 조회 실패");
  }

  return rows[0].uuid;
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

module.exports = {
  getGroupByUuid,
  updateGroupImages,
  getMyGroups,
  createGroup,
  searchGroups,
  respondToGroupInvite,
  sendGroupInvite,
  getGroupMembers,
};
