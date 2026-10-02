const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const db = require('../config/db');

async function changeAdminEmail(targetNewEmail = 'ranjukumari754@gmail.com', oldAdminEmail = 'admin@gallery.com') {
  const normalizedNewEmail = String(targetNewEmail).trim().toLowerCase();
  const normalizedOldEmail = String(oldAdminEmail).trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedNewEmail)) {
    throw new Error('Invalid target email format.');
  }

  // 1. Find existing admin user
  const [oldUsers] = await db.query(
    'SELECT id, name, email, role, password_hash, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))',
    [normalizedOldEmail]
  );

  let currentAdmin;
  if (oldUsers && oldUsers.length) {
    currentAdmin = oldUsers[0];
  } else {
    // Check if the user is already on the new email
    const [alreadyOnNew] = await db.query(
      'SELECT id, name, email, role, password_hash, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))',
      [normalizedNewEmail]
    );
    if (alreadyOnNew && alreadyOnNew.length) {
      console.log(`ℹ️ Admin email is already set to: ${alreadyOnNew[0].email}`);
      return { success: true, user: alreadyOnNew[0], alreadyUpdated: true };
    }
    throw new Error(`Admin user with email '${normalizedOldEmail}' was not found in the database.`);
  }

  if (currentAdmin.role !== 'admin') {
    throw new Error('Target user account does not have admin role.');
  }

  // 2. Verify new email does not already belong to another account
  const [existingTarget] = await db.query(
    'SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))',
    [normalizedNewEmail]
  );
  if (existingTarget && existingTarget.length && existingTarget[0].id !== currentAdmin.id) {
    throw new Error(`Target email '${normalizedNewEmail}' is already registered to a different account.`);
  }

  const originalId = currentAdmin.id;
  const originalName = currentAdmin.name;
  const originalHash = currentAdmin.password_hash;
  const originalRole = currentAdmin.role;
  const originalCreatedAt = currentAdmin.created_at;

  // 3. Update ONLY users.email using parameterized SQL query
  await db.query(
    'UPDATE users SET email = ? WHERE id = ? AND role = ?',
    [normalizedNewEmail, originalId, 'admin']
  );

  // 4. Verify updated user
  const [updatedRows] = await db.query(
    'SELECT id, name, email, role, password_hash, created_at, updated_at FROM users WHERE id = ?',
    [originalId]
  );
  const updatedUser = updatedRows[0];

  const [totalUsersRows] = await db.query('SELECT COUNT(*)::int AS count FROM users');
  const totalUsers = totalUsersRows[0].count;

  // Strict verification of preserved fields
  if (updatedUser.email !== normalizedNewEmail) throw new Error('Email was not updated correctly.');
  if (updatedUser.id !== originalId) throw new Error('User ID was altered.');
  if (updatedUser.password_hash !== originalHash) throw new Error('Password hash was altered.');
  if (updatedUser.role !== originalRole) throw new Error('User role was altered.');
  if (updatedUser.name !== originalName) throw new Error('User name was altered.');

  console.log(`✅ Admin email successfully updated to: ${updatedUser.email}`);
  console.log(`✅ User ID (${updatedUser.id}), role (${updatedUser.role}), and password hash were completely preserved.`);
  console.log(`✅ Total admin count in database: ${totalUsers} (no duplicate account created).`);

  return {
    success: true,
    user: updatedUser,
    totalUsers,
  };
}

if (require.main === module) {
  changeAdminEmail()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ Admin email change failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { changeAdminEmail };
