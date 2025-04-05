// /backend/src/controllers/groupController.js

const groupModel = require("../models/groupModel");
const { saveGroupIcon, saveGroupPicture } = require("../utils/imageHelper");
// 이미지 URL을 절대 URL로 변환하는 헬퍼
const { formatImageUrl } = require("../utils/imageUrlHelper");
// validators 모듈에서 필요한 검증 함수들 가져오기
const { validateName, validateDescription } = require("../utils/validators");

const createGroup = async (req, res, next) => {
  try {
    // JWT 미들웨어를 통해 그룹 리더 uuid 획득
    const groupLeaderUuid = req.user.uuid;
    const { name, description, visibility } = req.body;

    // 그룹 이름 검증
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    // 그룹 설명 검증 (빈 문자열 허용)
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return res.status(400).json({ message: descriptionValidation.message });
    }

    // 공개 여부 검증: "public" 또는 "private"만 허용
    if (visibility !== "public" && visibility !== "private") {
      return res.status(400).json({ message: "유효한 공개 상태를 선택해 주세요." });
    }

    // 1단계: 이미지 정보 없이 그룹 생성 – DB에서 자동 생성한 UUID를 사용하도록 함
    // 여기서 그룹 생성 시 group_icon, group_picture는 null로 전달합니다.
    let createdGroup = await groupModel.createGroup(
      name,
      description,
      visibility,
      groupLeaderUuid,
      null, // 초기 groupIconUrl: null
      null, // 초기 groupPictureUrl: null
    );

    // DB에서 자동 생성된 그룹 uuid 획득
    const groupUuid = createdGroup.uuid;

    // req.files에서 각 이미지 파일 추출
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

    // 2단계: 이미지 있으면 저장 후 URL 획득
    let groupIconUrl = createdGroup.group_icon; // 처음에는 null
    let groupPictureUrl = createdGroup.group_picture; // 처음에는 null
    if (groupIconFile) {
      groupIconUrl = await saveGroupIcon(groupUuid, groupIconFile);
    }
    if (groupPictureFile) {
      groupPictureUrl = await saveGroupPicture(groupUuid, groupPictureFile);
    }

    // 이미지 URL이 업데이트되었으면 DB 업데이트 후, 다시 조회
    if (
      groupIconUrl !== createdGroup.group_icon ||
      groupPictureUrl !== createdGroup.group_picture
    ) {
      await groupModel.updateGroupImages(groupUuid, groupIconUrl, groupPictureUrl);
      createdGroup = await groupModel.getGroupByUuid(groupUuid);
    }

    // 이미지 파일 경로에 서버 URL 붙이기 (절대 URL로 변환)
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

    // 각 그룹의 이미지 경로에 서버 URL 접두어 붙이기
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

module.exports = {
  createGroup,
  getMyGroups,
};
