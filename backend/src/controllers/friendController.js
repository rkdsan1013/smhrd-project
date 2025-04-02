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

exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const { targetUuid } = req.body;

    if (!targetUuid || targetUuid === requesterUuid) {
      return res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
    }

    const existing = await friendModel.checkFriendStatus(requesterUuid, targetUuid);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "이미 친구 상태이거나 요청 중입니다." });
    }

    await friendModel.createFriendRequest(requesterUuid, targetUuid);

    res.json({ success: true, message: "친구 요청이 전송되었습니다." });
  } catch (error) {
    console.error("[sendFriendRequest] Error:", error);
    res.status(500).json({ success: false, message: "친구 요청 중 오류 발생" });
  }
};

// 친구 요청 수락
exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    const requesterUuid = req.params.uuid;

    const success = await friendModel.acceptFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 요청 수락 실패" });
    }

    res.json({ success: true, message: "친구 요청을 수락했습니다." });
  } catch (err) {
    console.error("[acceptFriendRequest] Error:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 친구 요청 거절
exports.declineFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    const requesterUuid = req.params.uuid;

    const success = await friendModel.declineFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "거절할 친구 요청이 없습니다." });
    }

    res.json({ success: true, message: "친구 요청을 거절했습니다." });
  } catch (err) {
    console.error("[declineFriendRequest] Error:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 친구 요청 목록 조회
exports.getReceivedRequests = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    const rows = await friendModel.getReceivedFriendRequests(receiverUuid);

    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error("[getReceivedRequests] Error:", err);
    res.status(500).json({ success: false, message: "요청 목록을 불러오지 못했습니다." });
  }
};
