const customRequestModel = require('../models/customRequestModel');

async function create(req, res, next) {
  try {
    const { name, email, phone, artwork_type, preferred_size, budget, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'Name, email, phone and message are required.' });
    }
    const reference_image = req.file ? `/uploads/${req.file.filename}` : null;
    const id = await customRequestModel.create({
      name, email, phone, artwork_type, preferred_size, budget, message, reference_image,
    });
    res.status(201).json({ id, message: 'Your custom artwork request has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const requests = await customRequestModel.list();
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['NEW', 'CONTACTED', 'IN_DISCUSSION', 'ACCEPTED', 'REJECTED', 'COMPLETED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    await customRequestModel.updateStatus(req.params.id, status);
    res.json({ message: 'Request updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, updateStatus };
