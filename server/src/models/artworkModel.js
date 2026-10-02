const db = require('../config/db');

const BASE_SELECT = `
  SELECT a.*, c.name AS category_name, c.slug AS category_slug
  FROM artworks a
  LEFT JOIN categories c ON c.id = a.category_id
`;

async function list({ search, category, medium, availability, minPrice, maxPrice, sort, includeAll }) {
  const where = [];
  const params = [];

  if (search) {
    where.push('(a.title ILIKE ? OR a.description ILIKE ? OR a.medium ILIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (medium) {
    where.push('a.medium ILIKE ?');
    params.push(`%${medium}%`);
  }
  if (availability) {
    where.push('a.availability = ?');
    params.push(availability);
  }
  if (minPrice) {
    where.push('a.price >= ?');
    params.push(minPrice);
  }
  if (maxPrice) {
    where.push('a.price <= ?');
    params.push(maxPrice);
  }

  let sql = BASE_SELECT;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;

  const sortMap = {
    newest: 'a.created_at DESC',
    price_asc: 'a.price ASC',
    price_desc: 'a.price DESC',
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.newest}`;

  const [rows] = await db.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${BASE_SELECT} WHERE a.id = ?`, [id]);
  return rows[0];
}

async function findBySlug(slug) {
  const [rows] = await db.query(`${BASE_SELECT} WHERE a.slug = ?`, [slug]);
  return rows[0];
}

async function getImages(artworkId) {
  const [rows] = await db.query(
    'SELECT id, image_url, sort_order FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order ASC',
    [artworkId]
  );
  return rows;
}

async function getFeatured(limit = 6) {
  const [rows] = await db.query(
    `${BASE_SELECT} WHERE a.featured = TRUE ORDER BY a.created_at DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function getRelated(artworkId, categoryId, limit = 4) {
  const [rows] = await db.query(
    `${BASE_SELECT} WHERE a.category_id IS NOT DISTINCT FROM ? AND a.id != ? ORDER BY a.created_at DESC LIMIT ?`,
    [categoryId, artworkId, limit]
  );
  return rows;
}

async function create(data) {
  const [rows, meta] = await db.query(
    `INSERT INTO artworks
      (slug, title, description, price, product_type, medium, dimensions, creation_year,
       category_id, main_image, availability, quantity, featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     RETURNING id`,
    [
      data.slug, data.title, data.description, data.price, data.product_type,
      data.medium, data.dimensions, data.creation_year, data.category_id,
      data.main_image, data.availability || 'AVAILABLE', data.quantity ?? 1, !!data.featured,
    ]
  );
  return meta.insertId || (rows[0] && rows[0].id);
}

async function addImages(artworkId, urls) {
  if (!urls || !urls.length) return;
  const placeholders = [];
  const params = [];
  urls.forEach((url, idx) => {
    placeholders.push('(?, ?, ?)');
    params.push(artworkId, url, idx);
  });
  await db.query(
    `INSERT INTO artwork_images (artwork_id, image_url, sort_order) VALUES ${placeholders.join(', ')}`,
    params
  );
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const allowed = [
    'title', 'description', 'price', 'product_type', 'medium', 'dimensions',
    'creation_year', 'category_id', 'main_image', 'availability', 'quantity', 'featured', 'slug',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (!fields.length) return;
  params.push(id);
  await db.query(`UPDATE artworks SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function remove(id) {
  await db.query('DELETE FROM artworks WHERE id = ?', [id]);
}

// Atomically claims an artwork for an order: only succeeds if it is still
// AVAILABLE, using an optimistic-lock version bump so two simultaneous
// orders for the same one-of-one painting cannot both succeed.
async function tryReserveForOrder(conn, artworkId) {
  const [rows] = await conn.query(
    'SELECT id, price, availability, quantity, version, product_type FROM artworks WHERE id = ? FOR UPDATE',
    [artworkId]
  );
  const artwork = rows[0];
  if (!artwork) return { ok: false, reason: 'Artwork not found.' };
  if (artwork.availability !== 'AVAILABLE' || artwork.quantity < 1) {
    return { ok: false, reason: 'This artwork is no longer available.' };
  }

  const newQty = artwork.quantity - 1;
  const newAvailability = newQty <= 0 ? 'SOLD' : 'AVAILABLE';

  const [, meta] = await conn.query(
    `UPDATE artworks SET quantity = ?, availability = ?, version = version + 1
     WHERE id = ? AND version = ?`,
    [newQty, newAvailability, artworkId, artwork.version]
  );

  if (meta.affectedRows === 0) {
    return { ok: false, reason: 'This artwork was just claimed by another order. Please refresh.' };
  }

  return { ok: true, artwork };
}

async function deleteGalleryImage(artworkId, imageId) {
  const [rows] = await db.query('SELECT image_url FROM artwork_images WHERE id = ? AND artwork_id = ?', [imageId, artworkId]);
  if (!rows[0]) return null;
  await db.query('DELETE FROM artwork_images WHERE id = ? AND artwork_id = ?', [imageId, artworkId]);
  return rows[0].image_url;
}

module.exports = {
  list, findById, findBySlug, getImages, getFeatured, getRelated,
  create, addImages, update, remove, tryReserveForOrder, deleteGalleryImage,
};
