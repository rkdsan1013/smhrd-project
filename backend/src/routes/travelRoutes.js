// backend/src/routes/travelRoutes.js
const express = require("express");
const TravelController = require("../controllers/travelController");

const router = express.Router();

// 인기 여행지 목록 조회
router.get("/popular-travel-destinations", TravelController.getAllDestinations);

module.exports = router;