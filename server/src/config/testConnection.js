/**
 * testConnection.js
 * Run: node src/config/testConnection.js
 * Confirms MySQL pool is reachable before starting the server.
 */

require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('\n  ✅  MySQL connected successfully!');
    console.log(`      Host    : ${process.env.DB_HOST}`);
    console.log(`      Database: ${process.env.DB_NAME}`);

    const [rows] = await connection.query(`
      SELECT table_name
      FROM   information_schema.tables
      WHERE  table_schema = ?
      AND    table_name IN ('users','patients','doctors','staff','specializations')
      ORDER  BY table_name
    `, [process.env.DB_NAME]);

    console.log('\n      Tables 1-5 detected:');
    if (rows.length === 0) {
      console.log('      ⚠  None found. Run ekalusugan_schema.sql first.');
    } else {
      rows.forEach(r => console.log(`        ✔ ${r.table_name}`));
    }
  } catch (err) {
    console.error('\n  ❌  MySQL connection failed:', err.message);
    console.error('      Check .env credentials and confirm MySQL is running.');
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

testConnection();
