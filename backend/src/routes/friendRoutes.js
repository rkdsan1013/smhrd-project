// /backend/src/routes/friendRoutes.js

const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const friendController = require("../controllers/friendController");

// 친구 목록 조회
router.get("/", verifyToken, friendController.fetchFriends);

// 친구 요청 보내기
router.post("/", verifyToken, friendController.sendFriendRequest);

// 친구 검색
router.post("/search", verifyToken, friendController.searchUsers);

// 친구 요청 수락
router.patch("/:uuid/accept", verifyToken, friendController.acceptFriendRequest);

// 친구 요청 거절
router.delete("/:uuid/decline", verifyToken, friendController.declineFriendRequest);

// 친구 요청 취소
router.delete("/:uuid/cancel", verifyToken, friendController.cancelFriendRequest);

// 받은 친구 요청 목록 조회
router.get("/received", verifyToken, friendController.getReceivedRequests);

// 친구 삭제
router.delete("/:uuid", verifyToken, friendController.deleteFriend);

module.exports = router;
