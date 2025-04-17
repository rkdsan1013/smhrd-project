// /backend/src/controllers/friendController.js

const friendModel = require("../models/friendModel"); // 친구 모델
const userModel = require("../models/userModel"); // 사용자 모델

// 서버 주소를 포함한 프로필 사진 URL 포매팅
const formatProfile = (profile) => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  if (profile.profilePicture && !profile.profilePicture.startsWith("http")) {
    profile.profilePicture = serverUrl + profile.profilePicture;
  }
  return profile;
};

// 친구 목록 조회
exports.fetchFriends = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    // 승인된 친구의 uuid 목록 조회
    const friendUuids = await friendModel.getAcceptedFriendUuids(userUuid);
    if (!friendUuids || friendUuids.length === 0) {
      return res.json({ success: true, friends: [] });
    }
    const friends = await Promise.all(
      friendUuids.map(async (friend) => {
        // 사용자 프로필 조회 후 프로필 포매팅
        const profile = await userModel.getProfileByUuid(friend.uuid);
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

// 유저 검색
exports.searchUsers = async (req, res) => {
  try {
    const { keyword } = req.body;
    const selfUuid = req.user.uuid;
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ success: false, message: "검색어를 입력해주세요." });
    }
    // 키워드로 사용자 검색 후 결과 포매팅
    const users = await friendModel.searchUsersByKeyword(keyword, selfUuid);
    const formattedUsers = users.map(formatProfile);
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("[searchUsers] Error:", error);
    res.status(500).json({ success: false, message: "유저 검색 중 오류가 발생했습니다." });
  }
};

// 친구 요청 보내기
exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const { targetUuid } = req.body;
    const io = req.app.get("io");
    // 유효성 검사: 자기 자신에게 요청 불가
    if (!targetUuid || targetUuid === requesterUuid) {
      return res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
    }
    // 이미 친구 상태이거나 요청 중이면 거부
    const existing = await friendModel.checkFriendStatus(requesterUuid, targetUuid);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "이미 친구 상태이거나 요청 중입니다." });
    }
    // 친구 요청 생성
    await friendModel.createFriendRequest(requesterUuid, targetUuid);
    // 소켓 알림 전송
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

// 친구 요청 취소
exports.cancelFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const targetUuid = req.params.uuid;
    // pending 상태인 요청 취소
    const success = await friendModel.cancelFriendRequest(requesterUuid, targetUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 요청 취소 실패" });
    }
    // 소켓을 통해 취소 결과 전파
    if (global.io) {
      global.io.to(requesterUuid).emit("friendRequestCancelled", { targetUuid });
      global.io.to(targetUuid).emit("friendRequestCancelled", { targetUuid: requesterUuid });
    }
    res.json({ success: true, message: "친구 요청이 취소되었습니다." });
  } catch (error) {
    console.error("[cancelFriendRequest] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류로 요청 취소 실패" });
  }
};

// 친구 요청 수락
exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid; // 친구 요청 받은 사용자
    const requesterUuid = req.params.uuid; // 친구 요청 보낸 사용자
    // pending 상태인 요청을 accepted 상태로 업데이트
    const success = await friendModel.acceptFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 요청 수락 실패" });
    }
    // 요청자에게 수락 결과 전파
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

// 친구 요청 거절
exports.declineFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    const requesterUuid = req.params.uuid;
    // pending 상태인 요청 삭제
    const success = await friendModel.declineFriendRequest(receiverUuid, requesterUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "거절할 친구 요청이 없습니다." });
    }
    // 요청자에게 거절 결과 전파
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

// 받은 친구 요청 목록 조회
exports.getReceivedRequests = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    // pending 상태의 친구 요청 조회 (요청자 정보 포함)
    const rows = await friendModel.getReceivedFriendRequests(receiverUuid);
    const formatted = rows.map(formatProfile);
    res.json({ success: true, requests: formatted });
  } catch (err) {
    console.error("[getReceivedRequests] Error:", err);
    res.status(500).json({ success: false, message: "요청 목록을 불러오지 못했습니다." });
  }
};

// 친구 삭제 처리
exports.deleteFriend = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const targetUuid = req.params.uuid;
    // 두 사용자 간의 친구 관계 삭제
    const success = await friendModel.deleteFriend(userUuid, targetUuid);
    if (!success) {
      return res.status(400).json({ success: false, message: "친구 삭제 실패" });
    }
    // 상대방에게 삭제 알림 전송
    if (global.io) {
      global.io.to(targetUuid).emit("friendRemoved", { removedUuid: userUuid });
    }
    res.json({ success: true, message: "친구가 삭제되었습니다." });
  } catch (error) {
    console.error("[deleteFriend] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류로 친구 삭제 실패" });
  }
};
