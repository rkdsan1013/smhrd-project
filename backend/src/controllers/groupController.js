const groupModel = require("../models/groupModel");
const chatTransactions = require("../models/chatTransactions");
const chatModel = require("../models/chatModel");
const { saveGroupIcon, saveGroupPicture } = require("../utils/imageHelper");
const { formatImageUrl } = require("../utils/imageUrlHelper");
const { validateName, validateDescription } = require("../utils/validators");
const userModel = require("../models/userModel");
const pool = require("../config/db");

const formatProfile = (profile) => {
  if (profile.profilePicture) {
    profile.profilePicture = formatImageUrl(profile.profilePicture);
  }
  return profile;
};

const createGroup = async (req, res) => {
  try {
    if (!req.user || !req.user.uuid) {
      return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    }
    const groupLeaderUuid = req.user.uuid;
    const { name, description, visibility, survey } = req.body;

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return res.status(400).json({ message: descriptionValidation.message });
    }
    if (visibility !== "public" && visibility !== "private") {
      return res.status(400).json({ message: "유효한 공개 상태를 선택해 주세요." });
    }

    let surveyData = { activity_type: 0, budget_type: 0, trip_duration: 0 };
    if (survey) {
      try {
        const parsedSurvey = typeof survey === "string" ? JSON.parse(survey) : survey;
        surveyData = {
          activity_type: Number(parsedSurvey.activity_type) || 0,
          budget_type: Number(parsedSurvey.budget_type) || 0,
          trip_duration: Number(parsedSurvey.trip_duration) || 0,
        };
      } catch (parseError) {
        console.error("Error parsing survey data:", parseError.message, parseError.stack);
        return res.status(400).json({ message: "설문 데이터 형식이 잘못되었습니다." });
      }
    }

    let createdGroup = await groupModel.createGroup(
      name,
      description,
      visibility,
      groupLeaderUuid,
      null,
      null,
      surveyData,
    );
    if (!createdGroup || !createdGroup.uuid) {
      throw new Error("Failed to create group: createdGroup is invalid");
    }
    const groupUuid = createdGroup.uuid;

    let groupIconFile = null;
    let groupPictureFile = null;
    if (req.files) {
      if (req.files.groupIcon && req.files.groupIcon.length > 0) {
        groupIconFile = req.files.groupIcon[0];
      }
      if (req.files.groupPicture && req.files.groupPicture.length > 0) {
        groupPictureFile = req.files.groupPicture[0];
      }
    }
    let groupIconUrl = createdGroup.group_icon;
    let groupPictureUrl = createdGroup.group_picture;
    if (groupIconFile) {
      groupIconUrl = await saveGroupIcon(groupUuid, groupIconFile);
    }
    if (groupPictureFile) {
      groupPictureUrl = await saveGroupPicture(groupUuid, groupPictureFile);
    }
    if (
      groupIconUrl !== createdGroup.group_icon ||
      groupPictureUrl !== createdGroup.group_picture
    ) {
      await groupModel.updateGroupImages(groupUuid, groupIconUrl, groupPictureUrl);
      createdGroup = await groupModel.getGroupByUuid(groupUuid);
    }

    const groupRoomUuid = await chatTransactions.createGroupRoomWithLeader(
      groupUuid,
      groupLeaderUuid,
    );
    createdGroup.chat_room_uuid = groupRoomUuid;

    createdGroup.group_icon = formatImageUrl(createdGroup.group_icon);
    createdGroup.group_picture = formatImageUrl(createdGroup.group_picture);

    const responseGroup = {
      uuid: createdGroup.uuid,
      name: createdGroup.name,
      description: createdGroup.description,
      group_icon: createdGroup.group_icon,
      group_picture: createdGroup.group_picture,
      visibility: createdGroup.visibility,
      group_leader_uuid: createdGroup.group_leader_uuid,
      created_at: createdGroup.created_at,
      updated_at: createdGroup.updated_at,
      chat_room_uuid: String(createdGroup.chat_room_uuid),
    };
    res.status(201).json(responseGroup);
  } catch (error) {
    console.error("Error in createGroup:", error.message, error.stack);
    res.status(500).json({ message: `그룹 생성 실패: ${error.message}` });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    let groups = await groupModel.getMyGroups(userUuid);
    groups = groups.map((group) => ({
      ...group,
      group_icon: formatImageUrl(group.group_icon),
      group_picture: formatImageUrl(group.group_picture),
    }));
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message, error.stack);
    res.status(500).json({ message: `그룹 목록 조회 실패: ${error.message}` });
  }
};

const searchGroups = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "검색어가 필요합니다." });
    }
    let groups = await groupModel.searchGroups(name);
    groups = groups.map((group) => ({
      ...group,
      group_icon: formatImageUrl(group.group_icon),
      group_picture: formatImageUrl(group.group_picture),
    }));
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in searchGroups:", error.message, error.stack);
    res.status(500).json({ message: `그룹 검색 실패: ${error.message}` });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { groupUuid } = req.body;
    const userUuid = req.user.uuid;
    if (!groupUuid) {
      return res.status(400).json({ message: "그룹 UUID가 필요합니다." });
    }
    const myGroups = await groupModel.getMyGroups(userUuid);
    const isMember = myGroups.some((group) => group.uuid === groupUuid);
    if (isMember) {
      return res.status(400).json({ message: "이미 그룹의 멤버입니다." });
    }
    await pool.query(
      "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
      [groupUuid, userUuid],
    );
    res.status(200).json({ message: "그룹 참여 완료" });
  } catch (error) {
    console.error("Error in joinGroup:", error.message, error.stack);
    res.status(500).json({ message: `그룹 참여 실패: ${error.message}` });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userUuid = req.params.uuid;
    const profile = await userModel.getUserProfile(userUuid);
    if (!profile) {
      return res.status(404).json({ message: "사용자 프로필을 찾을 수 없습니다." });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error in getUserProfile:", error.message, error.stack);
    res.status(500).json({ message: `프로필 조회 실패: ${error.message}` });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupUuid } = req.params;
    let members = await groupModel.getGroupMembers(groupUuid);
    members = members.map((member) => {
      if (member.profilePicture) {
        member.profilePicture = formatImageUrl(member.profilePicture);
      }
      return member;
    });
    res.status(200).json({ members });
  } catch (error) {
    console.error("Error in getGroupMembers:", error.message, error.stack);
    res.status(500).json({ message: `그룹 멤버 조회 실패: ${error.message}` });
  }
};

const getGroupChatRoom = async (req, res) => {
  try {
    const { groupUuid } = req.params;
    const chatRoom = await chatModel.getGroupChatRoomByGroupUuid(groupUuid);
    if (!chatRoom) {
      return res.status(404).json({ message: "채팅방 정보를 찾을 수 없습니다." });
    }
    res.status(200).json({ chat_room_uuid: chatRoom.uuid });
  } catch (error) {
    console.error("Error in getGroupChatRoom:", error.message, error.stack);
    res.status(500).json({ message: `채팅방 조회 실패: ${error.message}` });
  }
};

const getSentGroupInvites = async (req, res) => {
  try {
    const groupUuid = req.params.groupUuid;
    const invitedByUuid = req.user.uuid;
    const invites = await groupModel.getSentInvitesByGroupAndSender(groupUuid, invitedByUuid);
    res.status(200).json(invites);
  } catch (error) {
    console.error("Error in getSentGroupInvites:", error.message, error.stack);
    res.status(500).json({ message: `보낸 초대 조회 실패: ${error.message}` });
  }
};

const getReceivedGroupInvites = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const invites = await groupModel.getReceivedInvitesByUserUuid(userUuid);
    res.status(200).json(invites);
  } catch (error) {
    console.error("Error in getReceivedGroupInvites:", error.message, error.stack);
    res.status(500).json({ message: `받은 초대 조회 실패: ${error.message}` });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const groupUuid = req.params.groupUuid;
    const userUuid = req.user.uuid;

    const [memberRows] = await pool.query(
      `SELECT 1 FROM group_members WHERE group_uuid = ? AND user_uuid = ?`,
      [groupUuid, userUuid],
    );
    if (memberRows.length === 0) {
      return res.status(403).json({ message: "그룹 멤버가 아닙니다." });
    }

    const [rows] = await pool.query(
      `SELECT uuid, name, description, group_icon, group_picture, visibility, group_leader_uuid, created_at, updated_at
       FROM group_info
       WHERE uuid = ?`,
      [groupUuid],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    }

    const group = {
      ...rows[0],
      group_icon: formatImageUrl(rows[0].group_icon),
      group_picture: formatImageUrl(rows[0].group_picture),
    };

    return res.json(group);
  } catch (error) {
    console.error("Error in getGroupDetails:", error.message, error.stack);
    return res.status(500).json({ message: `그룹 조회 실패: ${error.message}` });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const groupUuid = req.params.groupUuid;
    const userUuid = req.user.uuid;

    const [groupRows] = await pool.query(
      `SELECT group_leader_uuid FROM group_info WHERE uuid = ?`,
      [groupUuid],
    );
    if (groupRows.length === 0) {
      return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    }

    if (groupRows[0].group_leader_uuid === userUuid) {
      return res.status(403).json({ message: "그룹 리더는 탈퇴할 수 없습니다." });
    }

    const [memberRows] = await pool.query(
      `SELECT 1 FROM group_members WHERE group_uuid = ? AND user_uuid = ?`,
      [groupUuid, userUuid],
    );
    if (memberRows.length === 0) {
      return res.status(403).json({ message: "그룹 멤버가 아닙니다." });
    }

    await pool.query(`DELETE FROM group_members WHERE group_uuid = ? AND user_uuid = ?`, [
      groupUuid,
      userUuid,
    ]);

    global.io.to(groupUuid).emit("groupMemberLeft", { groupUuid, userUuid });

    console.log(`leaveGroup: User ${userUuid} left group ${groupUuid}`);
    return res.json({ message: "그룹에서 탈퇴되었습니다." });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message, error.stack);
    return res.status(500).json({ message: `그룹 탈퇴 실패: ${error.message}` });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  searchGroups,
  joinGroup,
  getUserProfile,
  getGroupMembers,
  getGroupChatRoom,
  getSentGroupInvites,
  getReceivedGroupInvites,
  getGroupDetails,
  leaveGroup,
};
