const db = require('../config/db');

async function listApproved({ artworkId, limit } = {}) {
  let sql = "SELECT * FROM reviews WHERE status = 'APPROVED'";
  const params = [];
  if (artworkId) {
    sql += ' AND artwork_id = ?';
    params.push(artworkId);
  }
  sql += ' ORDER BY created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  const [rows] = await db.query(sql, params);
  return rows;
}

async function listByStatus(status) {
  const [rows] = await db.query(
    'SELECT r.*, a.title AS artwork_title FROM reviews r LEFT JOIN artworks a ON a.id = r.artwork_id WHERE r.status = ? ORDER BY r.created_at DESC',
    [status]
  );
  return rows;
}

async function create({ customer_name, rating, review_text, artwork_id, order_id }) {
  const [rows, meta] = await db.query(
    `INSERT INTO reviews (customer_name, rating, review_text, artwork_id, order_id, status)
     VALUES (?,?,?,?,?, 'PENDING')
     RETURNING id`,
    [customer_name, rating, review_text, artwork_id || null, order_id || null]
  );
  return meta.insertId || (rows[0] && rows[0].id);
}

async function updateStatus(id, status) {
  await db.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
}

async function remove(id) {
  await db.query('DELETE FROM reviews WHERE id = ?', [id]);
}

async function countPending() {
  const [rows] = await db.query("SELECT COUNT(*)::int AS count FROM reviews WHERE status = 'PENDING'");
  return rows[0] ? Number(rows[0].count) : 0;
}

module.exports = { listApproved, listByStatus, create, updateStatus, remove, countPending };
