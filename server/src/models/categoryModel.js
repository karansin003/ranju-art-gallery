const db = require('../config/db');
const cache = require('../utils/cache');

const CATEGORIES_CACHE_KEY = 'categories_list';
const CATEGORIES_TTL_MS = 300000; // 5 minutes

async function list() {
  const cached = cache.get(CATEGORIES_CACHE_KEY);
  if (cached) return cached;

  const [rows] = await db.query('SELECT id, name, slug FROM categories ORDER BY name ASC');
  cache.set(CATEGORIES_CACHE_KEY, rows, CATEGORIES_TTL_MS);
  return rows;
}

async function create(name, slug) {
  const [rows, meta] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?) RETURNING id', [name, slug]);
  cache.del(CATEGORIES_CACHE_KEY);
  return meta.insertId || (rows[0] && rows[0].id);
}

async function remove(id) {
  await db.query('DELETE FROM categories WHERE id = ?', [id]);
  cache.del(CATEGORIES_CACHE_KEY);
}

module.exports = { list, create, remove };

