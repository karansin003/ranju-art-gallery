const db = require('../config/db');

async function list() {
  const [rows] = await db.query('SELECT * FROM videos ORDER BY display_order ASC, created_at DESC');
  return rows;
}

async function getFeatured(limit = 4) {
  const [rows] = await db.query(
    'SELECT * FROM videos WHERE featured = TRUE ORDER BY display_order ASC LIMIT ?',
    [limit]
  );
  return rows;
}

async function create({ title, youtube_url, youtube_video_id, description, featured, display_order }) {
  const [rows, meta] = await db.query(
    `INSERT INTO videos (title, youtube_url, youtube_video_id, description, featured, display_order)
     VALUES (?,?,?,?,?,?)
     RETURNING id`,
    [title, youtube_url, youtube_video_id, description || null, !!featured, display_order || 0]
  );
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
}

async function remove(id) {
  await db.query('DELETE FROM videos WHERE id = ?', [id]);
}

module.exports = { list, getFeatured, create, update, remove };
