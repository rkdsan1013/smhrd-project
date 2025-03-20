// /backend/src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10, // 필요에 따라 조정
  queueLimit: 0,
});

pool.getConnection()
  .then((conn) => {
    console.log('Connected to the MySQL database.');
    conn.release();
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

module.exports = pool;
