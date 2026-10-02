const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

async function resetAdminPassword(options = {}) {
  const emailInput = options.email !== undefined ? options.email : process.env.ADMIN_RESET_EMAIL;
  const passwordInput = options.password !== undefined ? options.password : process.env.ADMIN_RESET_PASSWORD;

  const targetEmail = (emailInput || 'admin@gallery.com').trim().toLowerCase();

  // 1. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!targetEmail || !emailRegex.test(targetEmail)) {
    throw new Error('Invalid or missing email address.');
  }

  // 2. Validate password exists and meets minimum length
  if (!passwordInput || typeof passwordInput !== 'string') {
    throw new Error('ADMIN_RESET_PASSWORD environment variable is missing or empty.');
  }

  if (passwordInput.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  // 3. Lookup target user
  const user = await userModel.findByEmail(targetEmail);
  if (!user) {
    throw new Error('No user account found matching the target email.');
  }

  console.log('✅ Admin account found.');

  // 4. Validate target user role is admin
  if (user.role !== 'admin') {
    throw new Error('Target user account does not have admin privileges.');
  }

  // 5. Generate bcrypt hash with 12 rounds
  const passwordHash = await bcrypt.hash(passwordInput, 12);

  // 6. Update ONLY the password_hash
  const updated = await userModel.updatePassword(user.id, passwordHash);
  if (!updated) {
    throw new Error('Failed to update password in database.');
  }

  console.log('✅ Password reset completed successfully.');
  console.log('⚠️ Security recommendation: Please remove ADMIN_RESET_PASSWORD and ADMIN_RESET_EMAIL from your production environment variables.');

  return { success: true };
}

if (require.main === module) {
  resetAdminPassword()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ Password reset failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { resetAdminPassword };
