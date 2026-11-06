/**
 * db.js – MySQL Connection Pool
 * Uses mysql2/promise for async/await support.
 * A pool handles multiple simultaneous requests
 * without creating a new connection per request.
 */

const mysql = require('mysql2');
require('dotenv').config();

const clinicTimeZone = '+08:00';
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,    // queue requests when pool is full
  connectionLimit:    10,      // max simultaneous connections
  queueLimit:         0,       // 0 = unlimited queue
  timezone:           clinicTimeZone
});

// Initialize the MySQL session before queries or transactions can use it.
const getConnection = pool.getConnection.bind(pool);
const initialized = new WeakSet();
pool.getConnection = (callback) => getConnection((error, connection) => {
  if (error || initialized.has(connection)) return callback(error, connection);
  connection.query('SET SESSION time_zone = ?', [clinicTimeZone], (error) => {
    if (error) {
      connection.destroy();
      return callback(error);
    }
    initialized.add(connection);
    callback(null, connection);
  });
});

module.exports = pool.promise();
