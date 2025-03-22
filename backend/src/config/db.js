// /backend/src/config/db.js
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// 환경변수 로드
dotenv.config();

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  // 연결 정보
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  // 풀 설정
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // 날짜 정보를 문자열로 반환 (ISO 형식 대신 명시적 날짜 형식)
  dateStrings: true,

  // 추가 옵션
  charset: "utf8mb4", // 이모지 등 전체 유니코드 지원
  connectTimeout: 10000, // 연결 시도 제한 시간 (10초)
  timezone: "Z", // UTC 타임존 기준
  namedPlaceholders: true, // 명명된 플레이스홀더 사용
});

// DB 연결 테스트
pool
  .getConnection()
  .then((conn) => {
    console.log("Connected to the MySQL database.");
    conn.release();
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });

module.exports = pool;
