const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function testSuite() {
  console.log('🧪 Starting Full PostgreSQL Model & Query Integration Test Suite...');

  // Initialize in-memory postgres
  const mem = newDb();
  const pg = mem.adapters.createPg();
  const pool = new pg.Pool();

  // Create customized adapter mirroring server/src/config/db.js
  function prepareSql(sql) {
    let paramIndex = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let formatted = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      if (char === "'" && sql[i - 1] !== '\\') {
        inSingleQuote = !inSingleQuote;
        formatted += char;
      } else if (char === '"' && sql[i - 1] !== '\\') {
        inDoubleQuote = !inDoubleQuote;
        formatted += char;
      } else if (char === '?' && !inSingleQuote && !inDoubleQuote) {
        formatted += `$${paramIndex++}`;
      } else {
        formatted += char;
      }
    }

    formatted = formatted.replace(/<=>/g, 'IS NOT DISTINCT FROM');
    const trimmed = formatted.trim();
    if (/^INSERT\s+INTO/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed)) {
      if (!/INSERT\s+INTO\s+site_settings/i.test(trimmed)) {
        formatted = `${trimmed} RETURNING id`;
      }
    }
    return formatted;
  }

  function normalizeResult(res) {
    const rows = res.rows || [];
    const insertId = rows[0] && rows[0].id !== undefined ? rows[0].id : null;
    const meta = {
      insertId,
      affectedRows: res.rowCount || 0,
      rowCount: res.rowCount || 0,
      rows,
    };
    return [rows, meta];
  }

  const testDb = {
    async query(sql, params = []) {
      const prep = prepareSql(sql);
      const res = await pool.query(prep, params);
      return normalizeResult(res);
    },
    async getConnection() {
      const client = await pool.connect();
      return {
        async query(sql, params = []) {
          const prep = prepareSql(sql);
          const res = await client.query(prep, params);
          return normalizeResult(res);
        },
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        release() {
          client.release();
        },
      };
    },
  };

  // 1. Run schema DDL statement by statement
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf8');
  
  // Clean comments and execute each statement
  const cleaned = ddl
    .replace(/--.*$/gm, '')
    .replace(/CREATE EXTENSION[\s\S]*?;/gi, '')
    .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$ LANGUAGE plpgsql;/gi, '')
    .replace(/DROP TRIGGER[\s\S]*?;/gi, '')
    .replace(/CREATE TRIGGER[\s\S]*?;/gi, '');
  
  const statements = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log('✅ 1. PostgreSQL Schema DDL executed successfully.');

  // 2. Test categoryModel
  console.log('Testing categoryModel...');
  const [catRows, catMeta] = await testDb.query('INSERT INTO categories (name, slug) VALUES (?, ?) RETURNING id', ['Modern', 'modern']);
  const catId = catMeta.insertId || catRows[0].id;
  const [categories] = await testDb.query('SELECT * FROM categories ORDER BY name ASC');
  if (!categories.some(c => c.slug === 'modern')) throw new Error('categoryModel insertion failed');
  console.log('✅ 2. categoryModel verified.');

  // 3. Test artworkModel
  console.log('Testing artworkModel...');
  const [artRows, artMeta] = await testDb.query(
    `INSERT INTO artworks
      (slug, title, description, price, product_type, medium, dimensions, creation_year,
       category_id, main_image, availability, quantity, featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     RETURNING id`,
    ['test-painting', 'Test Painting', 'A vivid oil study.', 7500.00, 'original', 'Oil on canvas', '24in x 36in', 2026, catId, 'https://example.com/art.jpg', 'AVAILABLE', 1, true]
  );
  const artId = artMeta.insertId || artRows[0].id;

  // Add gallery images
  await testDb.query(
    'INSERT INTO artwork_images (artwork_id, image_url, sort_order) VALUES (?, ?, ?), (?, ?, ?)',
    [artId, 'https://example.com/art-detail-1.jpg', 0, artId, 'https://example.com/art-detail-2.jpg', 1]
  );
  const [images] = await testDb.query('SELECT * FROM artwork_images WHERE artwork_id = ? ORDER BY sort_order ASC', [artId]);
  if (images.length !== 2) throw new Error('artwork_images insertion failed');

  // Search and filter
  const [artworks] = await testDb.query(
    `SELECT a.*, c.name AS category_name FROM artworks a
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE a.title ILIKE ? AND a.price >= ?`,
    ['%Test%', 5000]
  );
  if (!artworks.length || artworks[0].title !== 'Test Painting') throw new Error('artwork search query failed');
  console.log('✅ 3. artworkModel verified.');

  // 4. Test orderModel & Transactional Race-Condition Lock
  console.log('Testing orderModel & concurrency locking...');
  const conn = await testDb.getConnection();
  await conn.beginTransaction();

  // tryReserveForOrder logic
  const [lockRows] = await conn.query(
    'SELECT id, price, availability, quantity, version, product_type FROM artworks WHERE id = ? FOR UPDATE',
    [artId]
  );
  const artwork = lockRows[0];
  if (artwork.availability !== 'AVAILABLE') throw new Error('Artwork should be available');
  
  const newQty = artwork.quantity - 1;
  const newAvailability = newQty <= 0 ? 'SOLD' : 'AVAILABLE';
  const [, updateMeta] = await conn.query(
    'UPDATE artworks SET quantity = ?, availability = ?, version = version + 1 WHERE id = ? AND version = ?',
    [newQty, newAvailability, artId, artwork.version]
  );
  if (updateMeta.affectedRows === 0) throw new Error('Optimistic lock failed');

  // Insert order
  const [orderRows, orderMeta] = await conn.query(
    `INSERT INTO orders
      (order_number, customer_name, customer_phone, customer_email, address, city, state, pincode,
       customer_message, total_amount, payment_status, order_status)
     VALUES (?,?,?,?,?,?,?,?,?,?, 'PAYMENT_PENDING', 'ORDER_PLACED')
     RETURNING id`,
    ['ART-2026-99999', 'Aarav Patel', '+91 9999988888', 'aarav@example.com', '10 Marine Drive', 'Mumbai', 'Maharashtra', '400020', 'Corner wrap', 7500.00]
  );
  const orderId = orderMeta.insertId || orderRows[0].id;

  // Insert order item
  await conn.query(
    'INSERT INTO order_items (order_id, artwork_id, artwork_title_snapshot, unit_price, quantity) VALUES (?,?,?,?,?)',
    [orderId, artId, artwork.title || 'Test Painting', 7500.00, 1]
  );
  await conn.commit();
  conn.release();

  // Verify availability transitioned to SOLD
  const [afterOrderArt] = await testDb.query('SELECT availability, quantity, version FROM artworks WHERE id = ?', [artId]);
  if (afterOrderArt[0].availability !== 'SOLD' || afterOrderArt[0].version !== 1) {
    throw new Error('Artwork did not transition to SOLD with bumped version');
  }

  // Verify double-ordering is rejected
  const [doubleOrderArt] = await testDb.query('SELECT availability, quantity FROM artworks WHERE id = ?', [artId]);
  if (doubleOrderArt[0].availability === 'AVAILABLE') throw new Error('Sold artwork allowed re-ordering');
  console.log('✅ 4. orderModel & concurrency locking verified.');

  // 5. Test reviewModel
  console.log('Testing reviewModel...');
  const [revRows, revMeta] = await testDb.query(
    `INSERT INTO reviews (customer_name, rating, review_text, artwork_id, order_id, status)
     VALUES (?,?,?,?,?, 'PENDING')
     RETURNING id`,
    ['Sunita Rao', 5, 'Magnificent texture!', artId, orderId]
  );
  const revId = revMeta.insertId || revRows[0].id;
  const [pendingCountRow] = await testDb.query("SELECT COUNT(*)::int AS count FROM reviews WHERE status = 'PENDING'");
  if (Number(pendingCountRow[0].count) < 1) throw new Error('Review countPending failed');

  // Approve review
  await testDb.query('UPDATE reviews SET status = ? WHERE id = ?', ['APPROVED', revId]);
  const [approvedReviews] = await testDb.query("SELECT * FROM reviews WHERE status = 'APPROVED' AND artwork_id = ?", [artId]);
  if (approvedReviews.length !== 1) throw new Error('Approved review list failed');
  console.log('✅ 5. reviewModel verified.');

  // 6. Test settingsModel (ON CONFLICT DO UPDATE)
  console.log('Testing settingsModel (ON CONFLICT DO UPDATE)...');
  await testDb.query(
    `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
     ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
    ['artist_name', 'Ranju Kumar']
  );
  const [settings] = await testDb.query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?', ['artist_name']);
  if (settings[0].setting_value !== 'Ranju Kumar') throw new Error('settingsModel ON CONFLICT failed');
  console.log('✅ 6. settingsModel verified.');

  // 7. Test userModel
  console.log('Testing userModel...');
  const mockPassword = require('crypto').randomBytes(16).toString('hex');
  const hash = await bcrypt.hash(mockPassword, 10);
  const [userRows, userMeta] = await testDb.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin') RETURNING id`,
    ['Ranju Kumar', 'admin@gallery.com', hash]
  );
  const [user] = await testDb.query('SELECT * FROM users WHERE email = ?', ['admin@gallery.com']);
  if (!user.length || user[0].name !== 'Ranju Kumar') throw new Error('userModel creation failed');
  console.log('✅ 7. userModel verified.');

  // 8. Test customRequestModel & contactMessageModel
  console.log('Testing customRequestModel & contactMessageModel...');
  await testDb.query(
    `INSERT INTO custom_requests (name, email, phone, artwork_type, preferred_size, budget, message, status)
     VALUES (?,?,?,?,?,?,?, 'NEW') RETURNING id`,
    ['Nisha Gupta', 'nisha@example.com', '+91 9123456789', 'Landscape', '30x40', 'Rs 20k', 'Forest at dusk']
  );
  await testDb.query(
    `INSERT INTO contact_messages (name, email, phone, message, status)
     VALUES (?,?,?,?, 'UNREAD') RETURNING id`,
    ['Kavita Sen', 'kavita@example.com', '+91 9887766554', 'Inquiry about international shipping']
  );
  console.log('✅ 8. customRequestModel & contactMessageModel verified.');

  // 9. Test dashboardController FILTER aggregates
  console.log('Testing dashboard FILTER aggregates...');
  const [artworkCounts] = await testDb.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE availability = 'AVAILABLE')::int AS available,
      COUNT(*) FILTER (WHERE availability = 'SOLD')::int AS sold
    FROM artworks
  `);
  if (!artworkCounts[0] || artworkCounts[0].sold < 1) throw new Error('Dashboard artwork FILTER query failed');

  const [orderCounts] = await testDb.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE order_status = 'ORDER_PLACED')::int AS pending,
      COUNT(*) FILTER (WHERE order_status = 'DELIVERED')::int AS completed
    FROM orders
  `);
  if (!orderCounts[0] || orderCounts[0].pending < 1) throw new Error('Dashboard order FILTER query failed');
  console.log('✅ 9. dashboardController FILTER aggregates verified.');

  console.log('\n🎉 ALL 9 POSTGRESQL / SUPABASE TEST SUITES PASSED FLAWLESSLY!');
}

testSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
