const groupModel = require("../models/groupModel");
const { saveGroupIcon, saveGroupPicture } = require("../utils/imageHelper");
const { formatImageUrl } = require("../utils/imageUrlHelper");
const { validateName, validateDescription } = require("../utils/validators");
const userModel = require("../models/userModel");
const pool = require("../config/db");

const createGroup = async (req, res, next) => {
  try {
    const groupLeaderUuid = req.user.uuid;
    const { name, description, visibility } = req.body;

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

    let createdGroup = await groupModel.createGroup(
      name,
      description,
      visibility,
      groupLeaderUuid,
      null,
      null,
    );
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

    createdGroup.group_icon = formatImageUrl(createdGroup.group_icon);
    createdGroup.group_picture = formatImageUrl(createdGroup.group_picture);

    res.status(201).json(createdGroup);
  } catch (error) {
    next(error);
  }
};

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

/* 그룹 참여 기능 */
// 현재 사용자가 그룹의 멤버인지 SELECT_GROUPS_FOR_MEMBER 쿼리를 통해 확인한 후,
// 멤버가 아니라면 INSERT 문을 사용하여 group_members 테이블에 등록합니다.
const joinGroup = async (req, res, next) => {
  try {
    const { groupUuid } = req.body;
    const userUuid = req.user.uuid;
    if (!groupUuid) {
      return res.status(400).json({ message: "그룹 UUID가 필요합니다." });
    }

    // 이미 그룹 멤버인지 확인 (SELECT_GROUPS_FOR_MEMBER 사용)
    const myGroups = await groupModel.getMyGroups(userUuid);
    const isMember = myGroups.some((group) => group.uuid === groupUuid);
    if (isMember) {
      return res.status(400).json({ message: "이미 그룹의 멤버입니다." });
    }

    // 그룹 멤버로 등록 (role: 'member')
    const [result] = await pool.query(
      "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
      [groupUuid, userUuid],
    );
    res.status(200).json({ message: "그룹 참여 완료" });
  } catch (error) {
    next(error);
  }
};

/* 그룹 리더(사용자) 프로필 조회 함수 */
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

module.exports = {
  createGroup,
  getMyGroups,
  searchGroups,
  joinGroup,
  getUserProfile,
};
