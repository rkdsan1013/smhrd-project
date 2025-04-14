// /backend/src/models/groupModel.js

const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");
const friendModel = require("./friendModel");

// DB 연결 상태 확인
const checkDbConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("DB connection successful:", rows);
  } catch (error) {
    console.error("DB connection failed:", error.message, error.stack);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// 그룹 단건 조회: uuid를 기준으로 그룹 정보를 조회
const getGroupByUuid = async (groupUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
    const group = rows[0];
    if (!group) {
      throw new Error(`Group not found for UUID: ${groupUuid}`);
    }
    const sanitizedGroup = { ...group };
    console.log("Sanitized group from getGroupByUuid:", sanitizedGroup);
    return sanitizedGroup;
  } catch (error) {
    console.error("Error in getGroupByUuid:", error.message, error.stack);
    throw new Error(`Failed to fetch group: ${error.message}`);
  }
};

// 그룹 이미지 업데이트: 그룹 아이콘, 그룹 사진 URL 업데이트
const updateGroupImages = async (groupUuid, groupIconUrl, groupPictureUrl) => {
  try {
    const [result] = await pool.query(groupQueries.UPDATE_GROUP_IMAGES, [
      groupIconUrl,
      groupPictureUrl,
      groupUuid,
    ]);
    console.log("Update group images result:", result);
    return result;
  } catch (error) {
    console.error("Error in updateGroupImages:", error.message, error.stack);
    throw new Error(`Failed to update group images: ${error.message}`);
  }
};

// 내 그룹 목록 조회: 사용자가 가입한 그룹 조회
const getMyGroups = async (userUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getMyGroups:", error.message, error.stack);
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }
};

// 그룹 검색: 그룹 이름에 키워드 포함 여부로 검색
const searchGroups = async (name) => {
  try {
    const [rows] = await pool.query(groupQueries.SEARCH_GROUPS_BY_NAME, [`%${name}%`]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in searchGroups:", error.message, error.stack);
    throw new Error(`Failed to search groups: ${error.message}`);
  }
};

// 그룹 생성: 그룹 생성 트랜잭션을 통해 그룹 생성 (DB에서 자동 생성된 uuid 사용)
const createGroup = async (
  name,
  description,
  visibility,
  groupLeaderUuid,
  groupIconUrl,
  groupPictureUrl,
  surveyData,
) => {
  let conn;
  try {
    console.log("Attempting to get DB connection");
    await checkDbConnection();
    conn = await pool.getConnection();
    console.log("DB connection acquired");

    console.log("Starting transaction for group creation");
    await conn.beginTransaction();

    console.log("Step 1: Inserting into group_info:", {
      name,
      description,
      visibility,
      groupLeaderUuid,
    });
    const [insertResult] = await conn.query(groupQueries.INSERT_GROUP_INFO, [
      name,
      description,
      groupIconUrl,
      groupPictureUrl,
      visibility,
      groupLeaderUuid,
    ]);
    console.log("Insert group_info result:", insertResult);

    console.log("Step 2: Retrieving groupUuid");
    const [groupRows] = await conn.query(groupQueries.SELECT_LATEST_GROUP_UUID);
    console.log("Group rows:", groupRows);
    const groupUuid = groupRows[0]?.uuid;
    if (!groupUuid) {
      throw new Error("Failed to retrieve groupUuid from group_info");
    }
    console.log("Retrieved groupUuid:", groupUuid);

    console.log("Step 3: Inserting into group_members:", { groupUuid, groupLeaderUuid });
    const [memberResult] = await conn.query(groupQueries.INSERT_GROUP_MEMBER, [
      groupUuid,
      groupLeaderUuid,
    ]);
    console.log("Insert group_members result:", memberResult);

    console.log("Step 4: Verifying group_uuid exists in group_info");
    const [groupCheck] = await conn.query("SELECT uuid FROM group_info WHERE uuid = ?", [
      groupUuid,
    ]);
    if (!groupCheck[0]) {
      throw new Error(`group_uuid ${groupUuid} does not exist in group_info`);
    }

    console.log("Step 5: Inserting into group_surveys");
    const surveyValues = [
      groupUuid,
      surveyData.activity_type || 0,
      surveyData.budget_type || 0,
      surveyData.trip_duration || 0,
    ];
    console.log("Survey values:", surveyValues);
    const [surveyResult] = await conn.query(groupQueries.INSERT_GROUP_SURVEY, surveyValues);
    console.log("Insert group_surveys result:", surveyResult);

    console.log("Step 6: Committing transaction");
    await conn.commit();

    // 커밋 후 데이터 확인
    console.log("Verifying commit by fetching group_info");
    const [verifyGroup] = await conn.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
    if (!verifyGroup[0]) {
      throw new Error("Transaction commit failed: group_info data not found after commit");
    }
    console.log("Verified group_info after commit:", verifyGroup[0]);

    console.log("Verifying group_members after commit");
    const [verifyMembers] = await conn.query(
      "SELECT * FROM group_members WHERE group_uuid = ? AND user_uuid = ?",
      [groupUuid, groupLeaderUuid],
    );
    if (!verifyMembers[0]) {
      throw new Error("Transaction commit failed: group_members data not found after commit");
    }
    console.log("Verified group_members after commit:", verifyMembers[0]);

    console.log("Verifying group_surveys after commit");
    const [verifySurveys] = await conn.query("SELECT * FROM group_surveys WHERE group_uuid = ?", [
      groupUuid,
    ]);
    if (!verifySurveys[0]) {
      throw new Error("Transaction commit failed: group_surveys data not found after commit");
    }
    console.log("Verified group_surveys after commit:", verifySurveys[0]);

    console.log("Step 7: Fetching created group");
    const [createdGroup] = await conn.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
    if (!createdGroup[0]) {
      throw new Error(`Failed to fetch created group with UUID: ${groupUuid}`);
    }
    const groupInfo = { ...createdGroup[0] };
    console.log("Sanitized groupInfo:", groupInfo);
    return groupInfo;
  } catch (error) {
    console.error("Error in createGroup (groupModel):", error.message, error.stack);
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      console.error("Foreign key constraint failed:", error.sqlMessage);
      throw new Error(`Foreign key constraint failed: ${error.sqlMessage}`);
    }
    if (error.code === "ER_DUP_ENTRY") {
      console.error("Duplicate entry error:", error.sqlMessage);
      throw new Error(`Duplicate entry error: ${error.sqlMessage}`);
    }
    if (conn) {
      await conn.rollback();
      console.log("Transaction rolled back");
    }
    throw new Error(`Failed to create group: ${error.message}`);
  } finally {
    if (conn) {
      conn.release();
      console.log("DB connection released");
    }
  }
};

// 그룹 멤버 조회: group_members와 user_profiles 조인하여 멤버 정보 반환
const getGroupMembers = async (groupUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_GROUP_MEMBERS, [groupUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getGroupMembers:", error.message, error.stack);
    throw new Error(`Failed to fetch group members: ${error.message}`);
  }
};

// 그룹 초대 생성 함수
const sendGroupInvite = async (groupUuid, inviterUuid, invitedUserUuid) => {
  try {
    const [existing] = await pool.query(
      "SELECT * FROM group_invites WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?",
      [groupUuid, inviterUuid, invitedUserUuid],
    );
    if (existing.length > 0) {
      return existing[0].uuid;
    }
    await pool.query(
      "INSERT INTO group_invites (group_uuid, invited_by_uuid, invited_user_uuid) VALUES (?, ?, ?)",
      [groupUuid, inviterUuid, invitedUserUuid],
    );
    const [rows] = await pool.query(
      "SELECT uuid FROM group_invites WHERE group_uuid = ? AND invited_by_uuid = ? AND invited_user_uuid = ?",
      [groupUuid, inviterUuid, invitedUserUuid],
    );
    return rows[0].uuid;
  } catch (error) {
    console.error("Error in sendGroupInvite:", error.message, error.stack);
    throw new Error(`Failed to send group invite: ${error.message}`);
  }
};

const getSentInvitesByGroupAndSender = async (groupUuid, invitedByUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_SENT_GROUP_INVITES, [
      groupUuid,
      invitedByUuid,
    ]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getSentInvitesByGroupAndSender:", error.message, error.stack);
    throw new Error(`Failed to fetch sent invites: ${error.message}`);
  }
};

const getReceivedInvitesByUserUuid = async (userUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_RECEIVED_GROUP_INVITES, [userUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getReceivedInvitesByUserUuid:", error.message, error.stack);
    throw new Error(`Failed to fetch received invites: ${error.message}`);
  }
};

module.exports = {
  getGroupByUuid,
  updateGroupImages,
  getMyGroups,
  createGroup,
  searchGroups,
  getGroupMembers,
  sendGroupInvite,
  getSentInvitesByGroupAndSender,
  getReceivedInvitesByUserUuid,
};
