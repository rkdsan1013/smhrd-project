// /backend/src/controllers/groupController.js

const groupModel = require("../models/groupModel");
const chatTransactions = require("../models/chatTransactions");
const chatModel = require("../models/chatModel"); // 그룹 채팅방 조회용 모델
const { saveGroupIcon, saveGroupPicture } = require("../utils/imageHelper");
const { formatImageUrl } = require("../utils/imageUrlHelper");
const { validateName, validateDescription } = require("../utils/validators");
const userModel = require("../models/userModel");
const pool = require("../config/db");

// 프로필 이미지 URL 포매팅
const formatProfile = (profile) => {
  if (profile.profilePicture) {
    profile.profilePicture = formatImageUrl(profile.profilePicture);
  }
  return profile;
};

// 그룹 생성
const createGroup = async (req, res, next) => {
  try {
    const groupLeaderUuid = req.user.uuid;
    const { name, description, visibility } = req.body;

    // 그룹 이름 및 설명, 공개 상태 검사
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

    // 그룹 생성 (아이콘, 사진은 null로 초기화)
    let createdGroup = await groupModel.createGroup(
      name,
      description,
      visibility,
      groupLeaderUuid,
      null,
      null,
    );
    const groupUuid = createdGroup.uuid;

    // 업로드된 파일 처리 (그룹 아이콘, 그룹 사진)
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
    // 이미지가 변경되었으면 DB 업데이트
    if (
      groupIconUrl !== createdGroup.group_icon ||
      groupPictureUrl !== createdGroup.group_picture
    ) {
      await groupModel.updateGroupImages(groupUuid, groupIconUrl, groupPictureUrl);
      createdGroup = await groupModel.getGroupByUuid(groupUuid);
    }

    // 그룹 채팅방 생성 및 그룹 리더 추가
    const groupRoomUuid = await chatTransactions.createGroupRoomWithLeader(
      groupUuid,
      groupLeaderUuid,
    );
    createdGroup.chat_room_uuid = groupRoomUuid;

    // 이미지 URL 포매팅
    createdGroup.group_icon = formatImageUrl(createdGroup.group_icon);
    createdGroup.group_picture = formatImageUrl(createdGroup.group_picture);

    res.status(201).json(createdGroup);
  } catch (error) {
    next(error);
  }
};

// 내 그룹 목록 조회
const getMyGroups = async (req, res, next) => {
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
    next(error);
  }
};

// 그룹 검색
const searchGroups = async (req, res, next) => {
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
    next(error);
  }
};

// 그룹 참여 (가입)
const joinGroup = async (req, res, next) => {
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
    next(error);
  }
};

// 그룹 리더 프로필 조회
const getUserProfile = async (req, res, next) => {
  try {
    const userUuid = req.params.uuid;
    const profile = await userModel.getUserProfile(userUuid);
    if (!profile) {
      return res.status(404).json({ message: "사용자 프로필을 찾을 수 없습니다." });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// 그룹 멤버 조회
const getGroupMembers = async (req, res, next) => {
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
    next(error);
  }
};

// 그룹 채팅방 UUID 조회
const getGroupChatRoom = async (req, res, next) => {
  try {
    const { groupUuid } = req.params;
    const chatRoom = await chatModel.getGroupChatRoomByGroupUuid(groupUuid);
    if (!chatRoom) {
      return res.status(404).json({ message: "채팅방 정보를 찾을 수 없습니다." });
    }
    res.status(200).json({ chat_room_uuid: chatRoom.uuid });
  } catch (error) {
    next(error);
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
};
