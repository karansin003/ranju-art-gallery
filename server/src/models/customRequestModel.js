const db = require('../config/db');

async function create(data) {
  const [rows, meta] = await db.query(
    `INSERT INTO custom_requests
      (name, email, phone, artwork_type, preferred_size, budget, message, reference_image, status)
     VALUES (?,?,?,?,?,?,?,?, 'NEW')
     RETURNING id`,
    [
      data.name, data.email, data.phone, data.artwork_type || null, data.preferred_size || null,
      data.budget || null, data.message, data.reference_image || null,
    ]
  );
  return meta.insertId || (rows[0] && rows[0].id);
}

async function list() {
  const [rows] = await db.query('SELECT * FROM custom_requests ORDER BY created_at DESC');
  return rows;
}

async function updateStatus(id, status) {
  await db.query('UPDATE custom_requests SET status = ? WHERE id = ?', [status, id]);
}

async function countNew() {
  const [rows] = await db.query("SELECT COUNT(*)::int AS count FROM custom_requests WHERE status = 'NEW'");
  return rows[0] ? Number(rows[0].count) : 0;
}

module.exports = { create, list, updateStatus, countNew };
