const reviewModel = require('../models/reviewModel');

async function listApproved(req, res, next) {
  try {
    const { artworkId, limit } = req.query;
    const reviews = await reviewModel.listApproved({ artworkId, limit: limit ? Number(limit) : undefined });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { customer_name, rating, review_text, artwork_id, order_id } = req.body;
    if (!customer_name || !rating || !review_text) {
      return res.status(400).json({ error: 'Name, rating and review text are required.' });
    }
    const r = Number(rating);
    if (r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

    const id = await reviewModel.create({ customer_name, rating: r, review_text, artwork_id, order_id });
    res.status(201).json({ id, message: 'Thank you — your review has been submitted and is awaiting approval.' });
  } catch (err) {
    next(err);
  }
}

async function listByStatus(req, res, next) {
  try {
    const status = (req.params.status || 'PENDING').toUpperCase();
    const reviews = await reviewModel.listByStatus(status);
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    await reviewModel.updateStatus(req.params.id, status);
    res.json({ message: 'Review updated.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await reviewModel.remove(req.params.id);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listApproved, create, listByStatus, updateStatus, remove };
