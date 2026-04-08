/**
 * db.js – MySQL Connection Pool
 * Uses mysql2/promise for async/await support.
 * A pool handles multiple simultaneous requests
 * without creating a new connection per request.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,    // queue requests when pool is full
  connectionLimit:    10,      // max simultaneous connections
  queueLimit:         0,       // 0 = unlimited queue
  timezone:           '+08:00' // Philippine Standard Time
});

module.exports = pool;
