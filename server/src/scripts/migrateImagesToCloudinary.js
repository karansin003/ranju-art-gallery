/**
 * Optional, Non-Destructive Migration Script
 * Migrates existing local uploaded images (/uploads/...) to Cloudinary.
 *
 * Usage:
 *   node server/src/scripts/migrateImagesToCloudinary.js
 *
 * Safe:
 *   - Does NOT delete original local files.
 *   - Does NOT touch artworks that already have a Cloudinary URL or public ID.
 *   - Can be run multiple times safely (idempotent).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { UPLOAD_DIR } = require('../config/upload');
const cloudinaryConfig = require('../config/cloudinary');

async function migrate() {
  console.log('=== CLOUDINARY IMAGE MIGRATION UTILITY ===\n');

  if (!cloudinaryConfig.isConfigured()) {
    console.error('ERROR: Cloudinary credentials are not configured.');
    console.error('Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in your environment.');
    process.exit(1);
  }

  try {
    // 1. Migrate main artwork images
    const [artworks] = await db.query(
      "SELECT id, title, main_image FROM artworks WHERE main_image LIKE '/uploads/%' AND (cloudinary_public_id IS NULL OR cloudinary_public_id = '')"
    );

    console.log(`Found ${artworks.length} artwork(s) with local main images.`);
    let migratedArtworks = 0;

    for (const art of artworks) {
      const filename = path.basename(art.main_image);
      const localPath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(localPath)) {
        console.warn(`[SKIP] Local file not found on disk for artwork #${art.id} ("${art.title}"): ${localPath}`);
        continue;
      }

      console.log(`Uploading artwork #${art.id} ("${art.title}")...`);
      const uploadRes = await cloudinaryConfig.uploadArtworkImage(localPath);

      await db.query(
        'UPDATE artworks SET main_image = ?, cloudinary_public_id = ? WHERE id = ?',
        [uploadRes.url, uploadRes.public_id, art.id]
      );

      migratedArtworks++;
      console.log(`[SUCCESS] Artwork #${art.id} migrated to Cloudinary.`);
    }

    // 2. Migrate secondary gallery images
    const [galleryRows] = await db.query(
      "SELECT id, artwork_id, image_url FROM artwork_images WHERE image_url LIKE '/uploads/%' AND (cloudinary_public_id IS NULL OR cloudinary_public_id = '')"
    );

    console.log(`\nFound ${galleryRows.length} gallery image(s) with local files.`);
    let migratedGallery = 0;

    for (const img of galleryRows) {
      const filename = path.basename(img.image_url);
      const localPath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(localPath)) {
        console.warn(`[SKIP] Local file not found for gallery image #${img.id}: ${localPath}`);
        continue;
      }

      console.log(`Uploading gallery image #${img.id} for artwork #${img.artwork_id}...`);
      const uploadRes = await cloudinaryConfig.uploadArtworkImage(localPath);

      await db.query(
        'UPDATE artwork_images SET image_url = ?, cloudinary_public_id = ? WHERE id = ?',
        [uploadRes.url, uploadRes.public_id, img.id]
      );

      migratedGallery++;
      console.log(`[SUCCESS] Gallery image #${img.id} migrated to Cloudinary.`);
    }

    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`Artworks migrated: ${migratedArtworks}`);
    console.log(`Gallery images migrated: ${migratedGallery}`);
    console.log('Original local files preserved safely on disk.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err.message);
    process.exit(1);
  }
}

migrate();
