const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: "utf8mb4",
  connectTimeout: 10000,
  timezone: "Z",
  namedPlaceholders: true,
  multipleStatements: true, // 필요 시 활성화
  debug: process.env.NODE_ENV === "development" ? ["ComQueryPacket"] : false, // 쿼리 디버깅
});

pool
  .getConnection()
  .then((conn) => {
    console.log("Connected to the MySQL database.");
    conn.release();
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message, {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
  });

module.exports = pool;
