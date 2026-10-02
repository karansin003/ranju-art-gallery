const db = require('../config/db');

async function getAll() {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings');
  const settings = {};
  for (const row of rows) settings[row.setting_key] = row.setting_value;
  return settings;
}

async function updateMany(updates) {
  const keys = Object.keys(updates);
  if (!keys.length) return;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of keys) {
      await conn.query(
        `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
        [key, updates[key]]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAll, updateMany };
