// /backend/src/models/surveyQueries.js
const db = require("../config/db");

exports.insertSurvey = async (user_uuid, activity_type, budget_type, trip_duration) => {
  const query = `
    INSERT INTO user_travel_surveys (uuid, user_uuid, activity_type, budget_type, trip_duration)
    VALUES (UUID(), ?, ?, ?, ?)
  `;
  const values = [user_uuid, activity_type, budget_type, trip_duration];

  return await db.query(query, values); // 결과 그대로 반환
};