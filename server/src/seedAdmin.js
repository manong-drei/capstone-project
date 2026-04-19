require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

async function seed() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const hashed = await bcrypt.hash('Admin@1234', 10);

  await db.execute(
    `INSERT INTO users (username, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    ['bchc_admin', 'admin@bchc.gov.ph', '09000000000', hashed, 'admin']
  );

  console.log('Done.');
  console.log('Username : bchc_admin');
  console.log('Password : Admin@1234');
  await db.end();
}

seed().catch(console.error);