const contactMessageModel = require('../models/contactMessageModel');

async function create(req, res, next) {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    const id = await contactMessageModel.create({ name, email, phone, message });
    res.status(201).json({ id, message: 'Your message has been sent. The artist will get back to you soon.' });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const messages = await contactMessageModel.list();
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['UNREAD', 'READ', 'REPLIED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    await contactMessageModel.updateStatus(req.params.id, status);
    res.json({ message: 'Message updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, updateStatus };
