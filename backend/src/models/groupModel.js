const pool = require("../config/db");
const groupQueries = require("./groupQueries");
const groupTransactions = require("./groupTransactions");
const friendModel = require("./friendModel");
const { v4: uuidv4 } = require("uuid");

const checkDbConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("DB connection successful:", rows);
  } catch (error) {
    console.error("DB connection failed:", error.message, error.stack);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

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

const getMyGroups = async (userUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_GROUPS_FOR_MEMBER, [userUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getMyGroups:", error.message, error.stack);
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }
};

const searchGroups = async (name) => {
  try {
    const [rows] = await pool.query(groupQueries.SEARCH_GROUPS_BY_NAME, [`%${name}%`]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in searchGroups:", error.message, error.stack);
    throw new Error(`Failed to search groups: ${error.message}`);
  }
};

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
    await checkDbConnection();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [insertResult] = await conn.query(groupQueries.INSERT_GROUP_INFO, [
      name,
      description,
      groupIconUrl,
      groupPictureUrl,
      visibility,
      groupLeaderUuid,
    ]);

    const [groupRows] = await conn.query(groupQueries.SELECT_LATEST_GROUP_UUID);
    const groupUuid = groupRows[0]?.uuid;
    if (!groupUuid) {
      throw new Error("Failed to retrieve groupUuid from group_info");
    }

    await conn.query(groupQueries.INSERT_GROUP_MEMBER, [groupUuid, groupLeaderUuid]);

    const [groupCheck] = await conn.query("SELECT uuid FROM group_info WHERE uuid = ?", [
      groupUuid,
    ]);
    if (!groupCheck[0]) {
      throw new Error(`group_uuid ${groupUuid} does not exist in group_info`);
    }

    const surveyValues = [
      groupUuid,
      surveyData.activity_type || 0,
      surveyData.budget_type || 0,
      surveyData.trip_duration || 0,
    ];
    await conn.query(groupQueries.INSERT_GROUP_SURVEY, surveyValues);

    await conn.commit();

    const [createdGroup] = await conn.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
    if (!createdGroup[0]) {
      throw new Error(`Failed to fetch created group with UUID: ${groupUuid}`);
    }
    return { ...createdGroup[0] };
  } catch (error) {
    console.error("Error in createGroup:", error.message, error.stack);
    if (conn) await conn.rollback();
    throw new Error(`Failed to create group: ${error.message}`);
  } finally {
    if (conn) conn.release();
  }
};

const getGroupMembers = async (groupUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_GROUP_MEMBERS, [groupUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getGroupMembers:", error.message, error.stack);
    throw new Error(`Failed to fetch group members: ${error.message}`);
  }
};

const sendGroupInvite = async (groupUuid, inviterUuid, invitedUserUuid) => {
  try {
    const [existing] = await pool.query(groupQueries.CHECK_DUPLICATE_INVITE, [
      groupUuid,
      inviterUuid,
      invitedUserUuid,
    ]);
    if (existing.length > 0) {
      return existing[0].uuid;
    }
    await pool.query(groupQueries.INSERT_GROUP_INVITE, [groupUuid, inviterUuid, invitedUserUuid]);
    const [rows] = await pool.query(groupQueries.SELECT_LATEST_INVITE_UUID, [
      groupUuid,
      inviterUuid,
      invitedUserUuid,
    ]);
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

// 공지사항 생성
const createAnnouncement = async (groupUuid, authorUuid, title, content) => {
  try {
    await pool.query(groupQueries.INSERT_ANNOUNCEMENT, [groupUuid, authorUuid, title, content]);
    const [rows] = await pool.query(groupQueries.SELECT_ANNOUNCEMENTS_BY_GROUP, [groupUuid]);
    const createdAnnouncement = rows.find((row) => row.title === title && row.content === content);
    if (!createdAnnouncement) {
      throw new Error("Failed to fetch created announcement");
    }
    return createdAnnouncement;
  } catch (error) {
    console.error("Error in createAnnouncement:", error.message, error.stack);
    throw new Error(`Failed to create announcement: ${error.message}`);
  }
};

// 공지사항 목록 조회
const getAnnouncementsByGroup = async (groupUuid) => {
  try {
    const [rows] = await pool.query(groupQueries.SELECT_ANNOUNCEMENTS_BY_GROUP, [groupUuid]);
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error("Error in getAnnouncementsByGroup:", error.message, error.stack);
    throw new Error(`Failed to fetch announcements: ${error.message}`);
  }
};

const updateAnnouncement = async (groupUuid, announcementUuid, title, content) => {
  const [result] = await pool.query(groupQueries.UPDATE_ANNOUNCEMENT, [
    title,
    content,
    announcementUuid,
    groupUuid,
  ]);
  if (result.affectedRows === 0) {
    throw new Error("Announcement not found or unauthorized");
  }
  const [rows] = await pool.query(groupQueries.SELECT_ANNOUNCEMENTS_BY_GROUP, [groupUuid]);
  return rows.find((row) => row.uuid === announcementUuid);
};

const deleteAnnouncement = async (groupUuid, announcementUuid) => {
  const [result] = await pool.query(groupQueries.DELETE_ANNOUNCEMENT, [
    announcementUuid,
    groupUuid,
  ]);
  if (result.affectedRows === 0) {
    throw new Error("Announcement not found or unauthorized");
  }
  return { message: "공지사항이 삭제되었습니다." };
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
  createAnnouncement,
  getAnnouncementsByGroup,
  updateAnnouncement,
  deleteAnnouncement,
};
