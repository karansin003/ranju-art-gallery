const db = require('../config/db');

async function list() {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
  return rows;
}

async function create(name, slug) {
  const [rows, meta] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?) RETURNING id', [name, slug]);
  return meta.insertId || (rows[0] && rows[0].id);
}

async function remove(id) {
  await db.query('DELETE FROM categories WHERE id = ?', [id]);
}

module.exports = { list, create, remove };
