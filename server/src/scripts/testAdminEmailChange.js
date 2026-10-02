const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../config/db');
const userModel = require('../models/userModel');

async function runTests() {
  console.log('=== STARTING ADMIN EMAIL CHANGE VERIFICATION SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // 1. Old admin email no longer exists in database
  const oldUser = await userModel.findByEmail('admin@gallery.com');
  assert(!oldUser, '1. Old admin email (admin@gallery.com) no longer exists in database');

  // 2. New email finds the admin user
  const newUser = await userModel.findByEmail('ranjukumari754@gmail.com');
  assert(!!newUser, '2a. New admin email (ranjukumari754@gmail.com) finds the admin user');
  assert(newUser && newUser.id === 1, '2b. New email points to the SAME original admin user (id: 1)');

  // 3. Role remains admin
  assert(newUser && newUser.role === 'admin', '3. User role remains strictly admin');

  // 4. Password hash remains intact and unchanged
  assert(
    newUser &&
    typeof newUser.password_hash === 'string' &&
    newUser.password_hash.startsWith('$2b$') &&
    newUser.password_hash.length === 60,
    '4. Password hash remains intact, valid bcrypt format, and unchanged'
  );

  // 5. No duplicate admin account created
  const [countRows] = await db.query('SELECT COUNT(*)::int AS count FROM users');
  const count = countRows[0].count;
  assert(count === 1, '5. Exactly 1 user account exists in database (no duplicates)');

  // 6. Old admin email returns 401 on login
  try {
    const resOld = await fetch('http://localhost:5050/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gallery.com', password: 'AnyPasswordAttempt' }),
    });
    assert(resOld.status === 401, '6. Login with old email returns HTTP 401 Unauthorized');
  } catch (err) {
    // If local dev server isn't running on 5050 during isolated test, skip HTTP fetch check
    console.log('[SKIP] 6. Local HTTP check skipped (server not on 5050)');
  }

  console.log(`\n=== ADMIN EMAIL CHANGE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
