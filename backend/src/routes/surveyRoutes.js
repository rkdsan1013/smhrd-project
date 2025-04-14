// /backend/src/routes/surveyRoutes.js
const express = require("express");
const router = express.Router();
const surveyController = require("../controllers/surveyController");

// POST /api/surveys 요청을 컨트롤러로 라우팅
router.post("/", surveyController.createSurvey); // /api/surveys로 POST 요청이 오면 createSurvey 호출

module.exports = router;