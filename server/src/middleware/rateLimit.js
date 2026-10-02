const rateLimit = require('express-rate-limit');

// Tight limit on login to slow down brute-force attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Looser limit for public write endpoints (orders, reviews, contact, custom requests)
// to prevent spam/abuse without blocking real customers.
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

module.exports = { loginLimiter, publicWriteLimiter };
