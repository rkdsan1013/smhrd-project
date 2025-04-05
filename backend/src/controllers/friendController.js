// /backend/src/controllers/friendController.js

const friendModel = require("../models/friendModel");

// 서버 주소 포함한 프로필 사진 URL 생성 함수
const formatProfile = (profile) => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (profile.profilePicture && !profile.profilePicture.startsWith("http")) {
    profile.profilePicture = serverUrl + profile.profilePicture;
  }
  return profile;
};

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
        const formatted = formatProfile(profile);
        return {
          uuid: formatted.uuid,
          name: formatted.name,
          email: formatted.email,
          profilePicture: formatted.profilePicture || null,
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
    const formattedUsers = users.map(formatProfile);
    res.json({ success: true, users: formattedUsers });
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

    // 소켓을 통해 상대방에게 친구 요청 알림 전송
    if (global.io) {
      global.io.to(targetUuid).emit("friendRequestReceived", {
        from: requesterUuid,
        message: "새로운 친구 요청이 도착했습니다.",
      });
    }

    res.json({ success: true, message: "친구 요청이 전송되었습니다." });
  } catch (error) {
    console.error("[sendFriendRequest] Error:", error);
    res.status(500).json({ success: false, message: "친구 요청 중 오류 발생" });
  }
};

// 친구 요청 취소 기능 수정 – 요청 보낸 사람과 받는 사람 모두 업데이트
exports.cancelFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const targetUuid = req.params.uuid;

    const success = await friendModel.cancelFriendRequest(requesterUuid, targetUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 요청 취소 실패" });
    }

    // 소켓을 통해 두 사용자 모두에게 취소 결과 전파
    if (global.io) {
      // 요청 보낸 사용자(내 자신)에게 전파
      global.io.to(requesterUuid).emit("friendRequestCancelled", { targetUuid });
      // 요청 받는 사용자에게도 전파. 여기서는 targetUuid가 취소된 요청의 상대방이므로
      global.io.to(targetUuid).emit("friendRequestCancelled", { targetUuid: requesterUuid });
    }

    res.json({ success: true, message: "친구 요청이 취소되었습니다." });
  } catch (error) {
    console.error("[cancelFriendRequest] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류로 요청 취소 실패" });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid; // 수신자 (B)
    const requesterUuid = req.params.uuid; // 요청자 (A)

    const success = await friendModel.acceptFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 요청 수락 실패" });
    }

    // 요청자에게 수락 결과 실시간 전파
    if (global.io) {
      global.io.to(requesterUuid).emit("friendRequestResponded", {
        targetUuid: receiverUuid,
        status: "accepted",
      });
    }

    res.json({ success: true, message: "친구 요청을 수락했습니다." });
  } catch (err) {
    console.error("[acceptFriendRequest] Error:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

exports.declineFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid; // 수신자 (B)
    const requesterUuid = req.params.uuid; // 요청자 (A)

    const success = await friendModel.declineFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "거절할 친구 요청이 없습니다." });
    }

    // 요청자에게 거절 결과 실시간 전파
    if (global.io) {
      global.io.to(requesterUuid).emit("friendRequestResponded", {
        targetUuid: receiverUuid,
        status: "declined",
      });
    }

    res.json({ success: true, message: "친구 요청을 거절했습니다." });
  } catch (err) {
    console.error("[declineFriendRequest] Error:", err);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

exports.getReceivedRequests = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    const rows = await friendModel.getReceivedFriendRequests(receiverUuid);
    const formatted = rows.map(formatProfile);
    res.json({ success: true, requests: formatted });
  } catch (err) {
    console.error("[getReceivedRequests] Error:", err);
    res.status(500).json({ success: false, message: "요청 목록을 불러오지 못했습니다." });
  }
};

exports.getUserProfileByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const user = await friendModel.getUserProfileByUuid(uuid);
    if (!user) {
      return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
    }
    const formatted = formatProfile(user);
    res.json({ success: true, user: formatted });
  } catch (error) {
    console.error("[getUserProfileByUuid] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

exports.deleteFriend = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const targetUuid = req.params.uuid;

    const success = await friendModel.deleteFriend(userUuid, targetUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 삭제 실패" });
    }

    // 상대방에게도 삭제 알림 전송
    if (global.io) {
      global.io.to(targetUuid).emit("friendRemoved", {
        removedUuid: userUuid,
      });
    }

    res.json({ success: true, message: "친구가 삭제되었습니다." });
  } catch (error) {
    console.error("[deleteFriend] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류로 친구 삭제 실패" });
  }
};
