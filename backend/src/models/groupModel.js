// /backend/src/models/groupModel.js

const pool = require("../config/db");
const groupTransactions = require("./groupTransactions");
const groupQueries = require("./groupQueries");

// 그룹 생성 트랜잭션 호출
const createGroupTransaction = async (groupData) => {
  return await groupTransactions.createGroupTransaction(pool, groupData);
};

// 내가 가입한 그룹 리스트 조회 (userUuid에 해당하는 그룹들 반환)
const getMyGroups = async (userUuid) => {
  const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
  return rows;
};

module.exports = {
  createGroupTransaction,
  getMyGroups,
};
