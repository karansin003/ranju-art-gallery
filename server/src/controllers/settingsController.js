const fs = require('fs');
const settingsModel = require('../models/settingsModel');
const cloudinaryConfig = require('../config/cloudinary');

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

    // 1. Process profile_image upload if file provided
    const profileFile = req.files?.profile_image?.[0] || (req.file?.fieldname === 'profile_image' ? req.file : null);
    if (profileFile) {
      if (cloudinaryConfig.isConfigured()) {
        try {
          const uploadRes = await cloudinaryConfig.uploadArtworkImage(profileFile.path, {
            folder: 'ranju-art-gallery/profile',
            publicId: `profile_${Date.now()}`,
          });
          updates.profile_image = uploadRes.url;
          try { fs.unlinkSync(profileFile.path); } catch (_) {}
        } catch (uploadErr) {
          try { fs.unlinkSync(profileFile.path); } catch (_) {}
          console.error('[SETTINGS] Cloudinary profile upload failed:', uploadErr.message);
          return res.status(500).json({ error: 'Profile image upload to Cloudinary failed. Please try again.' });
        }
      } else {
        updates.profile_image = `/uploads/${profileFile.filename}`;
      }
    } else if (typeof req.body.profile_image === 'string') {
      updates.profile_image = req.body.profile_image.trim();
    }

    // 2. Process website_logo upload if file provided
    const logoFile = req.files?.website_logo?.[0] || (req.file?.fieldname === 'website_logo' ? req.file : null);
    if (logoFile) {
      if (cloudinaryConfig.isConfigured()) {
        try {
          const uploadRes = await cloudinaryConfig.uploadArtworkImage(logoFile.path, {
            folder: 'ranju-art-gallery/branding',
            publicId: `logo_${Date.now()}`,
          });
          updates.website_logo = uploadRes.url;
          try { fs.unlinkSync(logoFile.path); } catch (_) {}
        } catch (uploadErr) {
          try { fs.unlinkSync(logoFile.path); } catch (_) {}
          console.error('[SETTINGS] Cloudinary logo upload failed:', uploadErr.message);
          return res.status(500).json({ error: 'Logo upload to Cloudinary failed. Please try again.' });
        }
      } else {
        updates.website_logo = `/uploads/${logoFile.filename}`;
      }
    } else if (typeof req.body.website_logo === 'string') {
      updates.website_logo = req.body.website_logo.trim();
    }

    await settingsModel.updateMany(updates);
    const settings = await settingsModel.getAll();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublic, update };

