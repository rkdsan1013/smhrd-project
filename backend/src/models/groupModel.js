// /backend/src/models/groupModel.js

const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");

// 그룹 단건 조회: uuid 를 기준으로 그룹 정보를 조회합니다.
const getGroupByUuid = async (groupUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
  return rows[0];
};

// 그룹 이미지 업데이트
const updateGroupImages = async (groupUuid, groupIconUrl, groupPictureUrl) => {
  const [result] = await pool.query(groupQueries.UPDATE_GROUP_IMAGES, [
    groupIconUrl,
    groupPictureUrl,
    groupUuid,
  ]);
  return result;
};

// 내가 가입한 그룹 목록 조회 (특정 userUuid에 해당하는 그룹들)
const getMyGroups = async (userUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
  return rows;
};

// 그룹 이름으로 검색
const searchGroups = async (name) => {
  const [rows] = await pool.query(groupQueries.SEARCH_GROUPS_BY_NAME, [`%${name}%`]);
  return rows;
};

// 그룹 생성 트랜잭션 (DB에서 자동 생성된 uuid를 사용함)
// 매개변수: name, description, visibility, groupLeaderUuid, groupIconUrl, groupPictureUrl
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

// 그룹 멤버 조회: group_members와 user_profiles 테이블을 조인하여 멤버 정보를 반환합니다.
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
  getGroupMembers, // 새로 추가한 함수
};
