const db = require('../config/db');
const cache = require('../utils/cache');

async function list() {
  const cached = cache.get('videos_list');
  if (cached) return cached;
  const [rows] = await db.query('SELECT * FROM videos ORDER BY display_order ASC, created_at DESC');
  cache.set('videos_list', rows, 60000);
  return rows;
}

async function getFeatured(limit = 4) {
  const key = `videos_featured_${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const [rows] = await db.query(
    'SELECT * FROM videos WHERE featured = TRUE ORDER BY display_order ASC LIMIT ?',
    [limit]
  );
  cache.set(key, rows, 60000);
  return rows;
}

async function create({ title, youtube_url, youtube_video_id, description, featured, display_order }) {
  const [rows, meta] = await db.query(
    `INSERT INTO videos (title, youtube_url, youtube_video_id, description, featured, display_order)
     VALUES (?,?,?,?,?,?)
     RETURNING id`,
    [title, youtube_url, youtube_video_id, description || null, !!featured, display_order || 0]
  );
  cache.delPrefix('videos_');
  return meta.insertId || (rows[0] && rows[0].id);
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const allowed = ['title', 'youtube_url', 'youtube_video_id', 'description', 'featured', 'display_order'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (!fields.length) return;
  params.push(id);
  await db.query(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`, params);
  cache.delPrefix('videos_');
}

async function remove(id) {
  await db.query('DELETE FROM videos WHERE id = ?', [id]);
  cache.delPrefix('videos_');
}

module.exports = { list, getFeatured, create, update, remove };

