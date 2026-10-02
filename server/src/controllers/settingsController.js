const settingsModel = require('../models/settingsModel');

async function getPublic(req, res, next) {
  try {
    const settings = await settingsModel.getAll();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = { ...req.body };
    if (req.files?.profile_image?.[0]) {
      updates.profile_image = `/uploads/${req.files.profile_image[0].filename}`;
    }
    if (req.files?.website_logo?.[0]) {
      updates.website_logo = `/uploads/${req.files.website_logo[0].filename}`;
    }
    if (req.file) {
      updates.profile_image = `/uploads/${req.file.filename}`;
    }
    await settingsModel.updateMany(updates);
    const settings = await settingsModel.getAll();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublic, update };
