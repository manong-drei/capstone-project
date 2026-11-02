const fs = require('node:fs');
const path = require('node:path');
const pool = require('./db');

pool.query(fs.readFileSync(path.join(__dirname, '../../migrations/007_doctor_leaves.sql'), 'utf8'))
  .then(() => console.log('Doctor leave requests table installed.'))
  .catch((err) => { console.error('Leave migration failed:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());
