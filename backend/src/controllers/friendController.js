const friendModel = require("../models/friendModel");

exports.fetchFriends = async (req, res) => {
  try {
    const userUuid = req.user.uuid;

    const friendUuids = await friendModel.getAcceptedFriendUuids(userUuid);
    if (!friendUuids || friendUuids.length === 0) {
      return res.json({ success: true, friends: [] });
    }

    const friends = await Promise.all(
      friendUuids.map(async (friend) => {
        const profile = await friendModel.getFriendProfileByUuid(friend.uuid);
        return {
          uuid: profile.uuid,
          name: profile.name,
          email: profile.email,
          profilePicture: profile.profilePicture || null,
          status: "accepted",
        };
      }),
    );

    res.json({ success: true, friends });
  } catch (error) {
    console.error("[fetchFriends] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { keyword } = req.body;
    const selfUuid = req.user.uuid;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ success: false, message: "검색어를 입력해주세요." });
    }

    const users = await friendModel.searchUsersByKeyword(keyword, selfUuid);
    res.json({ success: true, users });
  } catch (error) {
    console.error("[searchUsers] Error:", error);
    res.status(500).json({ success: false, message: "유저 검색 중 오류가 발생했습니다." });
  }
};
