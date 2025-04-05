// /backend/src/models/groupModel.js

const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");

// 그룹 단건 조회: uuid 로 그룹 정보 조회
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

// 그룹 생성 트랜잭션 (DB에서 자동 생성된 uuid를 사용함)
// 매개변수: name, description, visibility, groupLeaderUuid, groupIconUrl, groupPictureUrl
// (이미지 URL은 파일 업로드가 있을 경우 업데이트할 수 있으므로 기본값은 null)
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
};
