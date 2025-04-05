// /src/routes/friendRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const friendController = require("../controllers/friendController");

router.get("/", verifyToken, friendController.fetchFriends);
router.post("/", verifyToken, friendController.sendFriendRequest);
router.post("/search", verifyToken, friendController.searchUsers);
router.patch("/:uuid/accept", verifyToken, friendController.acceptFriendRequest);
router.delete("/:uuid/decline", verifyToken, friendController.declineFriendRequest);
router.delete("/:uuid/cancel", verifyToken, friendController.cancelFriendRequest);
router.get("/received", verifyToken, friendController.getReceivedRequests);
router.get("/:uuid", verifyToken, friendController.getUserProfileByUuid);
router.delete("/:uuid", verifyToken, friendController.deleteFriend);

module.exports = router;
