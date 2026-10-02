const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const db = require('../config/db');

async function handleOneTimeAdminReset(env = process.env) {
  const emailRaw = env.ADMIN_RESET_EMAIL;
  const passwordRaw = env.ADMIN_RESET_PASSWORD;

  // 1. If BOTH variables are not provided, do nothing
  if (!emailRaw || !passwordRaw) {
    return { status: 'skipped', reason: 'missing_env' };
  }

  const normalizedEmail = String(emailRaw).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    console.warn('🔒 [AUTH] Password reset skipped: Invalid email format.');
    return { status: 'skipped', reason: 'invalid_email' };
  }

  if (typeof passwordRaw !== 'string' || passwordRaw.length < 8) {
    console.warn('🔒 [AUTH] Password reset skipped: Password must be at least 8 characters.');
    return { status: 'skipped', reason: 'invalid_password' };
  }

  // 2. Check idempotent marker in database (one-way SHA-256 fingerprint)
  const resetFingerprint = crypto
    .createHash('sha256')
    .update(`${normalizedEmail}:${passwordRaw}`)
    .digest('hex');

  try {
    const [markerRows] = await db.query(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'admin_reset_fingerprint' LIMIT 1"
    );
    if (markerRows && markerRows.length && markerRows[0].setting_value === resetFingerprint) {
      // Already executed for this exact reset instruction
      return { status: 'skipped', reason: 'already_executed' };
    }
  } catch (err) {
    // If site_settings is unavailable, continue carefully
  }

  // 3. Find target user
  const user = await userModel.findByEmail(normalizedEmail);
  if (!user) {
    console.warn('🔒 [AUTH] Password reset skipped: No user found for target email.');
    return { status: 'skipped', reason: 'user_not_found' };
  }

  // 4. Verify user has admin privileges
  if (user.role !== 'admin') {
    console.warn('🔒 [AUTH] Password reset skipped: Target account does not have admin privileges.');
    return { status: 'skipped', reason: 'not_admin' };
  }

  // 5. Generate bcrypt hash with 12 rounds
  const passwordHash = await bcrypt.hash(passwordRaw, 12);

  // 6. Update password_hash in database
  await userModel.updatePassword(user.id, passwordHash);

  // 7. Record the marker in site_settings so it never runs again on restarts
  try {
    await db.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('admin_reset_fingerprint', ?)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
      [resetFingerprint]
    );
  } catch (err) {
    console.error('🔒 [AUTH] Warning: Could not record reset marker:', err.message);
  }

  console.log('🔒 [AUTH] One-time admin password reset completed for admin account.');
  console.log('🔒 [AUTH] Recommendation: Remove ADMIN_RESET_PASSWORD and ADMIN_RESET_EMAIL from environment variables.');

  return { status: 'success', email: normalizedEmail };
}

module.exports = { handleOneTimeAdminReset };
