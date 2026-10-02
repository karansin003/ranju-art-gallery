const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config(); // fallback to current working directory

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const isSupabaseOrRemote =
  (connectionString && (connectionString.includes('supabase') || connectionString.includes('aws') || connectionString.includes('render') || connectionString.includes('pooler'))) ||
  process.env.NODE_ENV === 'production' ||
  process.env.DB_SSL === 'true';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
      ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Converts '?' placeholders to '$1, $2, ...' for postgres
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

  // Handle MySQL <=> operator -> IS NOT DISTINCT FROM in PostgreSQL
  formatted = formatted.replace(/<=>/g, 'IS NOT DISTINCT FROM');

  // If it's an INSERT without RETURNING, append RETURNING id so insertId is available (except for tables without id like site_settings)
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

async function query(sql, params = []) {
  const prepared = prepareSql(sql);
  const res = await pool.query(prepared, params);
  return normalizeResult(res);
}

async function rawQuery(sql) {
  return pool.query(sql);
}

async function getConnection() {
  const client = await pool.connect();
  return {
    async query(sql, params = []) {
      const prepared = prepareSql(sql);
      const res = await client.query(prepared, params);
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
}

module.exports = {
  query,
  rawQuery,
  getConnection,
  getClient: getConnection,
  pool,
};
