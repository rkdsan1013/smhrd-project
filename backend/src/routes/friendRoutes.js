const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const friendController = require("../controllers/friendController");

router.get("/", verifyToken, friendController.fetchFriends);
router.post("/", verifyToken, friendController.sendFriendRequest);
router.post("/search", verifyToken, friendController.searchUsers);
router.patch("/:uuid/accept", verifyToken, friendController.acceptFriendRequest);
router.delete("/:uuid/decline", verifyToken, friendController.declineFriendRequest);
router.get("/received", verifyToken, friendController.getReceivedRequests);
router.get("/:uuid", verifyToken, friendController.getUserProfileByUuid);

module.exports = router;
