const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");
const friendModel = require("./friendModel");

const getGroupByUuid = async (groupUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
  return rows[0];
};

const updateGroupImages = async (groupUuid, groupIconUrl, groupPictureUrl) => {
  const [result] = await pool.query(groupQueries.UPDATE_GROUP_IMAGES, [
    groupIconUrl,
    groupPictureUrl,
    groupUuid,
  ]);
  return result;
};

const getMyGroups = async (userUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
  return rows;
};

const searchGroups = async (name) => {
  const [rows] = await pool.query(groupQueries.SEARCH_GROUPS_BY_NAME, [`%${name}%`]);
  return rows;
};

// ✅ 초대 응답 처리
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
    await pool.query(groupQueries.INSERT_GROUP_MEMBER_FROM_INVITE, [invite.group_uuid, userUuid]);
    await pool.query(groupQueries.DELETE_ALL_INVITES_FOR_GROUP_AND_USER, [
      invite.group_uuid,
      userUuid,
    ]);
  } else {
    await pool.query(groupQueries.DELETE_GROUP_INVITE_BY_UUID, [inviteUuid]);
  }

  return { success: true, action };
};

// ✅ 초대 전송 시 중복 검사 및 그룹 멤버 여부 검사
const sendGroupInvite = async (groupUuid, inviterUuid, invitedUserUuid) => {
  // 1. 보내는 사람의 그룹 멤버 여부 확인
  const [memberRows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [inviterUuid]);
  const isMember = memberRows.some((g) => g.uuid === groupUuid);
  if (!isMember) {
    throw new Error("해당 그룹의 멤버만 초대를 보낼 수 있습니다.");
  }

  // 2. 받는 사람의 그룹 멤버 여부 확인
  const [isTargetMemberRows] = await pool.query(groupQueries.CHECK_IS_GROUP_MEMBER, [
    groupUuid,
    invitedUserUuid,
  ]);
  if (isTargetMemberRows.length > 0) {
    throw new Error("이미 그룹에 가입된 사용자입니다.");
  }

  // 3. 친구 여부 확인
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

  // 6. 최신 invite UUID 반환
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

module.exports = {
  getGroupByUuid,
  updateGroupImages,
  getMyGroups,
  createGroup,
  searchGroups,
  respondToGroupInvite,
  sendGroupInvite,
};
