// backend/src/controllers/travelController.js
const db = require("../config/db"); // DB 연결
const travelQueries = require("../models/travelQueries"); // 쿼리문
const TravelDestination = require("../models/travelModel"); // 모델

class TravelController {
  static async getAllDestinations(req, res) {
    try {
      const connection = await db.getConnection();
      const [rows] = await connection.query(travelQueries.getAllTravelDestinations);
      connection.release();
      const destinations = rows.map((row) => TravelDestination.fromDb(row));
      res.status(200).json(destinations);
    } catch (error) {
      console.error("컨트롤러 오류:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = TravelController;