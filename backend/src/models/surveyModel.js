// /backend/src/models/surveyModel.js
const surveyQueries = require("./surveyQueries");

exports.saveSurvey = async (surveyData) => {
  try {
    const { user_uuid, activity_type, budget_type, trip_duration } = surveyData;
    
    // 쿼리 실행
    const [result] = await surveyQueries.insertSurvey(
      user_uuid,
      activity_type,
      budget_type,
      trip_duration
    );

    // 삽입 성공 여부 확인
    if (result.affectedRows === 1) {
      return { success: true, message: "설문이 성공적으로 저장되었습니다." };
    } else {
      throw new Error("설문 데이터 삽입에 실패했습니다.");
    }
  } catch (error) {
    console.error("모델: 설문 데이터 저장 실패:", error);
    throw new Error("설문 데이터를 데이터베이스에 저장하는 중 오류가 발생했습니다.");
  }
};