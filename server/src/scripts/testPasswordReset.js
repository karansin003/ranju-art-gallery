const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcrypt');
const db = require('../config/db');
const userModel = require('../models/userModel');
const { resetAdminPassword } = require('./resetAdminPassword');
const { handleOneTimeAdminReset } = require('../services/adminResetService');

async function runTests() {
  console.log('=== STARTING ADMIN PASSWORD RESET TEST SUITE ===\n');

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

  // 1. Test missing environment variables / missing password
  try {
    await resetAdminPassword({ email: 'admin@gallery.com', password: '' });
    assert(false, '1. Missing password rejected', 'Did not throw');
  } catch (err) {
    assert(err.message.includes('missing or empty'), '1. Missing password rejected', err.message);
  }

  // 2. Test short password (< 8 chars)
  try {
    await resetAdminPassword({ email: 'admin@gallery.com', password: 'short' });
    assert(false, '2. Short password rejected', 'Did not throw');
  } catch (err) {
    assert(err.message.includes('at least 8 characters'), '2. Short password rejected', err.message);
  }

  // 3. Test invalid email
  try {
    await resetAdminPassword({ email: 'not-an-email', password: 'ValidPassword123!' });
    assert(false, '3. Invalid email format rejected', 'Did not throw');
  } catch (err) {
    assert(err.message.includes('Invalid or missing email address'), '3. Invalid email format rejected', err.message);
  }

  // 4. Test non-existent user
  try {
    await resetAdminPassword({ email: 'ghost_user_does_not_exist@example.com', password: 'ValidPassword123!' });
    assert(false, '4. Non-existent account rejected', 'Did not throw');
  } catch (err) {
    assert(err.message.includes('No user account found'), '4. Non-existent account rejected', err.message);
  }

  // 5. Test non-admin rejection
  const originalFindByEmail = userModel.findByEmail;
  try {
    userModel.findByEmail = async (email) => {
      if (email === 'fake_customer@example.com') {
        return { id: 999, name: 'Fake Customer', email, role: 'customer' };
      }
      return originalFindByEmail(email);
    };

    try {
      await resetAdminPassword({ email: 'fake_customer@example.com', password: 'NewSecurePassword123!' });
      assert(false, '5. Non-admin user reset rejected', 'Did not throw');
    } catch (err) {
      assert(err.message.includes('does not have admin privileges'), '5. Non-admin user reset rejected', err.message);
    }
  } finally {
    userModel.findByEmail = originalFindByEmail;
  }

  // 6. Test handleOneTimeAdminReset service (startup reset)
  // 6a. Missing environment variables
  const skipResult = await handleOneTimeAdminReset({});
  assert(skipResult.status === 'skipped' && skipResult.reason === 'missing_env', '6a. Startup reset skips when env vars are absent');

  // 6b. Non-admin rejection in startup reset
  try {
    userModel.findByEmail = async (email) => {
      if (email === 'fake_customer@example.com') {
        return { id: 999, name: 'Fake Customer', email, role: 'customer' };
      }
      return originalFindByEmail(email);
    };

    const nonAdminRes = await handleOneTimeAdminReset({
      ADMIN_RESET_EMAIL: 'fake_customer@example.com',
      ADMIN_RESET_PASSWORD: 'ValidPassword123!',
    });
    assert(nonAdminRes.status === 'skipped' && nonAdminRes.reason === 'not_admin', '6b. Startup reset rejects non-admin accounts');
  } finally {
    userModel.findByEmail = originalFindByEmail;
  }

  // 7. Successful one-time reset via handleOneTimeAdminReset & verify NO secrets logged
  const originalAdmin = await userModel.findByEmail('admin@gallery.com');
  if (!originalAdmin) {
    console.error('FATAL: admin@gallery.com not found in database to test.');
    process.exit(1);
  }

  const originalHash = originalAdmin.password_hash;
  const testNewPassword = 'StartupResetTestPassword2026!#';

  // Intercept console.log, warn, error to verify no password or hash is logged
  const capturedLogs = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args) => capturedLogs.push(args.join(' '));
  console.warn = (...args) => capturedLogs.push(args.join(' '));
  console.error = (...args) => capturedLogs.push(args.join(' '));

  let firstRunResult;
  let secondRunResult;
  try {
    // Run 1: First-time reset
    firstRunResult = await handleOneTimeAdminReset({
      ADMIN_RESET_EMAIL: 'admin@gallery.com',
      ADMIN_RESET_PASSWORD: testNewPassword,
    });

    // Run 2: Restart simulation with identical environment variables (must NOT repeat)
    secondRunResult = await handleOneTimeAdminReset({
      ADMIN_RESET_EMAIL: 'admin@gallery.com',
      ADMIN_RESET_PASSWORD: testNewPassword,
    });
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }

  assert(firstRunResult.status === 'success', '7a. Startup one-time reset succeeded on first run');
  assert(secondRunResult.status === 'skipped' && secondRunResult.reason === 'already_executed', '7b. Startup reset is strictly NOT repeated on subsequent runs (idempotent marker)');

  // Verify updated user hash works with bcrypt.compare
  const updatedAdmin = await userModel.findByEmail('admin@gallery.com');
  const passwordMatches = await bcrypt.compare(testNewPassword, updatedAdmin.password_hash);
  assert(passwordMatches, '7c. Updated password hash successfully verifies with new password');

  // Verify that neither the password nor the hash was printed
  const allLogs = capturedLogs.join('\n');
  const leakedPassword = allLogs.includes(testNewPassword);
  const leakedHash = allLogs.includes(updatedAdmin.password_hash);

  assert(!leakedPassword, '7d. Password was NOT logged to console');
  assert(!leakedHash, '7e. Bcrypt hash was NOT logged to console');

  // Clean up: delete test marker and restore original pre-test hash
  try {
    await db.query("DELETE FROM site_settings WHERE setting_key = 'admin_reset_fingerprint'");
    await userModel.updatePassword(originalAdmin.id, originalHash);
  } catch (err) {
    console.error('Cleanup error:', err);
  }

  console.log(`\n=== ADMIN PASSWORD RESET TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
