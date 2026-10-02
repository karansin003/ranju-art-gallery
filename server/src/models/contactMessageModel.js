const db = require('../config/db');

async function create({ name, email, phone, message }) {
  const [rows, meta] = await db.query(
    `INSERT INTO contact_messages (name, email, phone, message, status)
     VALUES (?,?,?,?, 'UNREAD')
     RETURNING id`,
    [name, email, phone || null, message]
  );
  return meta.insertId || (rows[0] && rows[0].id);
}

async function list() {
  const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
}

async function updateStatus(id, status) {
  await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
}

async function countUnread() {
  const [rows] = await db.query("SELECT COUNT(*)::int AS count FROM contact_messages WHERE status = 'UNREAD'");
  return rows[0] ? Number(rows[0].count) : 0;
}

async function recentForDashboard(limit = 5) {
  const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows;
}

module.exports = { create, list, updateStatus, countUnread, recentForDashboard };
