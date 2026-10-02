const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      console.log('🔒 [AUTH] Login attempt failed: Missing email or password.');
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await userModel.findByEmail(normalizedEmail);

    // Diagnostic logging without leaking credentials or hashes
    if (!user) {
      console.log('🔒 [AUTH] Login email lookup failure: No user account found for submitted email.');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log(`🔒 [AUTH] Login email lookup success: Account found with role='${user.role}'.`);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('🔒 [AUTH] Password verification failure: Bcrypt comparison mismatch.');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log('🔒 [AUTH] Password verification success: Bcrypt comparison matched.');

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('🔒 [AUTH] Login error:', err.message);
    next(err);
  }
}

// One-time bootstrap endpoint to create the first admin account.
// Disables itself automatically once any admin user exists, so it can
// safely stay deployed without becoming a backdoor.
async function setupFirstAdmin(req, res, next) {
  try {
    const existing = await userModel.count();
    if (existing > 0) {
      return res.status(403).json({ error: 'Admin setup has already been completed.' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const id = await userModel.create({ name, email, password_hash });
    res.status(201).json({ id, message: 'Admin account created. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, setupFirstAdmin, me };
