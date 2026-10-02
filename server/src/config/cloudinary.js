const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an artwork image to Cloudinary.
 * Applies f_auto and q_auto optimizations while preserving fine art visual fidelity.
 * @param {string} filePath Local path to the uploaded temporary image.
 * @param {object} options Optional parameters.
 * @returns {Promise<{ url: string, public_id: string }>}
 */
async function uploadArtworkImage(filePath, options = {}) {
  if (!isConfigured()) {
    // If Cloudinary is not configured (e.g. local dev without keys), throw or return fallback
    const err = new Error('Cloudinary credentials are not configured on the server.');
    err.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw err;
  }

  const folder = options.folder || 'ranju-art-gallery/artworks';
  const publicId = options.publicId || `art_${Date.now()}_${Math.round(Math.random() * 1e9)}`;

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    public_id: publicId,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Safely delete an asset from Cloudinary.
 * Idempotent: returns null on failure or if asset does not exist, never throws.
 * @param {string} publicId
 * @returns {Promise<object|null>}
 */
async function deleteArtworkImage(publicId) {
  if (!publicId || !isConfigured()) return null;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
    return res;
  } catch (err) {
    console.error('Cloudinary asset cleanup warning:', err.message);
    return null;
  }
}

module.exports = {
  cloudinary,
  isConfigured,
  uploadArtworkImage,
  deleteArtworkImage,
};
