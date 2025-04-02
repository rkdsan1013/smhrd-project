const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const friendController = require("../controllers/friendController");

router.get("/", verifyToken, friendController.fetchFriends);
router.post("/", verifyToken, friendController.sendFriendRequest);
router.post("/search", verifyToken, friendController.searchUsers);

module.exports = router;
