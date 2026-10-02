const db = require('../config/db');

async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function create({ name, email, password_hash }) {
  const [rows, meta] = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')
     RETURNING id`,
    [name, email, password_hash]
  );
  return meta.insertId || (rows[0] && rows[0].id);
}

async function count() {
  const [rows] = await db.query('SELECT COUNT(*)::int AS count FROM users');
  return rows[0] ? Number(rows[0].count) : 0;
}

module.exports = { findByEmail, create, count };
