// /backend/src/controllers/surveyController.js

const surveyModel = require("../models/surveyModel");

exports.createSurvey = async (req, res) => {
  const surveyData = req.body;
  try {
    await surveyModel.saveSurvey(surveyData);
    res.status(201).json({ success: true, message: "설문이 성공적으로 저장되었습니다." });
  } catch (error) {
    console.error("컨트롤러: 설문 저장 실패:", error.message);
    res
      .status(500)
      .json({ success: false, message: error.message || "설문 저장 중 오류가 발생했습니다." });
  }
};
