// /backend/src/controllers/groupController.js
const groupModel = require("../models/groupModel");
const { v4: uuidv4 } = require("uuid");
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

    // 컨트롤러에서 미리 UUID 생성
    const groupUuid = uuidv4();

    // 이미지 파일이 있으면 저장 후 URL 획득
    let groupIconUrl = null;
    let groupPictureUrl = null;
    if (groupIconFile) {
      groupIconUrl = await saveGroupIcon(groupUuid, groupIconFile);
    }
    if (groupPictureFile) {
      groupPictureUrl = await saveGroupPicture(groupUuid, groupPictureFile);
    }

    // 모델 트랜잭션을 통해 그룹 생성 (group_info, group_members 삽입)
    const createdGroup = await groupModel.createGroupTransaction({
      groupUuid,
      name,
      description,
      visibility,
      groupIconUrl,
      groupPictureUrl,
      groupLeaderUuid,
    });

    // 이미지 파일 경로에 서버 URL 붙이기 (절대 URL로 변환)
    createdGroup.group_icon = formatImageUrl(createdGroup.group_icon);
    createdGroup.group_picture = formatImageUrl(createdGroup.group_picture);

    res.status(201).json(createdGroup);
  } catch (error) {
    next(error);
  }
};

// 내가 가입한 그룹 리스트 조회
const getMyGroups = async (req, res, next) => {
  try {
    const userUuid = req.user.uuid;
    let groups = await groupModel.getMyGroups(userUuid);

    // 각 그룹의 이미지 경로에 서버 URL을 접두어로 붙임
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
