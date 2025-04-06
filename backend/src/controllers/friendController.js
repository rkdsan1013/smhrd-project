// /backend/src/controllers/friendController.js

const friendModel = require("../models/friendModel");
const userModel = require("../models/userModel"); // userModel 임포트 추가

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

    // 새 테이블 구조에 맞춰 내부 쿼리가 변경되었지만
    // getAcceptedFriendUuids의 결과는 { uuid: '상대방 uuid' }로 동일하게 유지됩니다.
    const friendUuids = await friendModel.getAcceptedFriendUuids(userUuid);
    if (!friendUuids || friendUuids.length === 0) {
      return res.json({ success: true, friends: [] });
    }

    const friends = await Promise.all(
      friendUuids.map(async (friend) => {
        // 기존 friendModel.getFriendProfileByUuid 대신 userModel.getProfileByUuid 사용
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
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { keyword } = req.body;
    const selfUuid = req.user.uuid;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ success: false, message: "검색어를 입력해주세요." });
    }

    // 내부 모델의 검색 쿼리는 새 테이블 구조에 맞게 조정되었으므로 그대로 사용합니다.
    const users = await friendModel.searchUsersByKeyword(keyword, selfUuid);
    const formattedUsers = users.map(formatProfile);
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("[searchUsers] Error:", error);
    res.status(500).json({
      success: false,
      message: "유저 검색 중 오류가 발생했습니다.",
    });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const { targetUuid } = req.body;

    if (!targetUuid || targetUuid === requesterUuid) {
      return res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
    }

    // 친구 상태를 확인하여 이미 존재하면 진행하지 않습니다.
    const existing = await friendModel.checkFriendStatus(requesterUuid, targetUuid);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "이미 친구 상태이거나 요청 중입니다." });
    }

    // 친구 요청 생성 (내부적으로 LEAST/GREATEST로 정렬 후 한 건 저장됨)
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
    res.status(500).json({
      success: false,
      message: "친구 요청 중 오류 발생",
    });
  }
};

exports.cancelFriendRequest = async (req, res) => {
  try {
    const requesterUuid = req.user.uuid;
    const targetUuid = req.params.uuid;

    // 내부 모델에서 pending 상태인 친구 요청 취소 (요청자 확인 등) 로직을 수행
    const success = await friendModel.cancelFriendRequest(requesterUuid, targetUuid);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "친구 요청 취소 실패",
      });
    }

    // 소켓을 통해 두 사용자 모두에게 취소 결과 전파
    if (global.io) {
      global.io.to(requesterUuid).emit("friendRequestCancelled", { targetUuid });
      global.io.to(targetUuid).emit("friendRequestCancelled", {
        targetUuid: requesterUuid,
      });
    }

    res.json({ success: true, message: "친구 요청이 취소되었습니다." });
  } catch (error) {
    console.error("[cancelFriendRequest] Error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류로 요청 취소 실패",
    });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid; // 수신자: 친구 요청을 받은 사용자
    const requesterUuid = req.params.uuid; // 요청자: 친구 요청을 보낸 사용자

    // 새로운 테이블 구조에 맞춰 내부 트랜잭션이 실행되며,
    // 단일 레코드의 상태가 pending에서 accepted로 업데이트됩니다.
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
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.declineFriendRequest = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid; // 수신자: 요청을 받은 사용자
    const requesterUuid = req.params.uuid; // 요청자: 친구 요청을 보낸 사용자

    // 내부 모델에서 pending 상태인 요청을 삭제합니다.
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
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.getReceivedRequests = async (req, res) => {
  try {
    const receiverUuid = req.user.uuid;
    // 내부 모델에서 내게 온 pending 요청(요청자 정보 포함)을 조회합니다.
    const rows = await friendModel.getReceivedFriendRequests(receiverUuid);
    const formatted = rows.map(formatProfile);
    res.json({ success: true, requests: formatted });
  } catch (err) {
    console.error("[getReceivedRequests] Error:", err);
    res.status(500).json({
      success: false,
      message: "요청 목록을 불러오지 못했습니다.",
    });
  }
};

exports.deleteFriend = async (req, res) => {
  try {
    const userUuid = req.user.uuid;
    const targetUuid = req.params.uuid;

    // 내부 모델에서 두 사용자 간의 친구 관계를 삭제합니다.
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
    res.status(500).json({
      success: false,
      message: "서버 오류로 친구 삭제 실패",
    });
  }
};
