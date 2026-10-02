require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cloudinaryConfig = require('../config/cloudinary');
const artworkController = require('../controllers/artworkController');
const artworkModel = require('../models/artworkModel');
const db = require('../config/db');

const BASE_URL = 'http://localhost:5050';

async function runCloudinarySuite() {
  console.log('=== CLOUDINARY INTEGRATION & SECURITY TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  const jwtSecret = process.env.JWT_SECRET || 'test_secret';
  const adminToken = jwt.sign({ id: 1, email: 'admin@gallery.com', role: 'admin' }, jwtSecret, { expiresIn: '1h' });
  const userToken = jwt.sign({ id: 99, email: 'user@example.com', role: 'user' }, jwtSecret, { expiresIn: '1h' });

  try {
    // 1. Secret Leak Check in Frontend Build
    const distPath = path.resolve(__dirname, '../../../client/dist');
    let secretInFrontend = false;
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(path.join(distPath, 'assets'));
      for (const f of files) {
        if (f.endsWith('.js') || f.endsWith('.css')) {
          const content = fs.readFileSync(path.join(distPath, 'assets', f), 'utf-8');
          if (
            content.includes('CLOUDINARY_API_SECRET') ||
            (process.env.CLOUDINARY_API_SECRET && content.includes(process.env.CLOUDINARY_API_SECRET)) ||
            (process.env.CLOUDINARY_API_KEY && content.includes(process.env.CLOUDINARY_API_KEY))
          ) {
            secretInFrontend = true;
            break;
          }
        }
      }
    }
    assert(!secretInFrontend, '14. No Cloudinary secrets appear in frontend production build');

    // 2. Database Schema Verification
    const [cols] = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'cloudinary_public_id'"
    );
    assert(cols.length > 0, '3a. Database has cloudinary_public_id column in artworks table');

    const [gCols] = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'artwork_images' AND column_name = 'cloudinary_public_id'"
    );
    assert(gCols.length > 0, '3b. Database has cloudinary_public_id column in artwork_images table');

    // 3. Normal user cannot upload artwork (returns 403)
    const dummyImageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const userForm = new FormData();
    userForm.append('title', 'Unauthorized Artwork');
    userForm.append('price', '1000');
    userForm.append('image', new Blob([dummyImageBytes], { type: 'image/png' }), 'test.png');
    const resUserUpload = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: userForm,
    });
    assert(resUserUpload.status === 403, '9. Normal user cannot upload artwork (403 Forbidden)', `Status: ${resUserUpload.status}`);

    // 4. Normal user cannot delete artwork (returns 403)
    const resUserDelete = await fetch(`${BASE_URL}/api/artworks/1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(resUserDelete.status === 403, '10. Normal user cannot delete artwork (403 Forbidden)', `Status: ${resUserDelete.status}`);

    // 5. Invalid file type rejected (returns 400)
    const badForm = new FormData();
    badForm.append('title', 'Exploit Test');
    badForm.append('price', '500');
    badForm.append('image', new Blob([Buffer.from('<?php echo "evil"; ?>')], { type: 'application/x-php' }), 'exploit.php');
    const resBad = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: badForm,
    });
    assert(resBad.status === 400, '11. Invalid file type rejected (400 Bad Request)', `Status: ${resBad.status}`);

    // 6. Oversized file rejected (returns 413)
    const bigBytes = Buffer.alloc(14 * 1024 * 1024, 0); // 14MB
    const bigForm = new FormData();
    bigForm.append('title', 'Oversized Test');
    bigForm.append('price', '500');
    bigForm.append('image', new Blob([bigBytes], { type: 'image/jpeg' }), 'large.jpg');
    const resBig = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: bigForm,
    });
    assert(resBig.status === 413, '12. Oversized file rejected (413 Payload Too Large)', `Status: ${resBig.status}`);

    // 7. Controller Unit Verification for Cloudinary Integration
    // Mock cloudinaryConfig functions to test upload, replacement, cleanup, and failure resilience
    let mockDeleteCalledWith = [];
    const originalIsConfigured = cloudinaryConfig.isConfigured;
    const originalUpload = cloudinaryConfig.uploadArtworkImage;
    const originalDelete = cloudinaryConfig.deleteArtworkImage;

    cloudinaryConfig.isConfigured = () => true;
    cloudinaryConfig.uploadArtworkImage = async (filePath) => {
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e6);
      return {
        url: `https://res.cloudinary.com/ranjuart/image/upload/v1727878900/ranju-art-gallery/artworks/art_${uniqueSuffix}.jpg`,
        public_id: `ranju-art-gallery/artworks/art_${uniqueSuffix}`,
      };
    };
    cloudinaryConfig.deleteArtworkImage = async (publicId) => {
      mockDeleteCalledWith.push(publicId);
      return { result: 'ok' };
    };

    // Helper to mock express req/res
    function mockReqRes(reqData) {
      let statusCode = 200;
      let responseBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return res;
        },
        json(data) {
          responseBody = data;
          return res;
        },
      };
      return { req: reqData, res, getResult: () => ({ status: statusCode, body: responseBody }) };
    }

    // A. Artwork Creation with Cloudinary
    // Create temporary dummy file on disk for controller
    const tempFilePath = path.join(__dirname, 'test_temp_art.png');
    fs.writeFileSync(tempFilePath, dummyImageBytes);

    const createCtx = mockReqRes({
      body: {
        title: 'Cloudinary Test Fine Art ' + Date.now(),
        price: '8500',
        description: 'Fine art with Cloudinary backing.',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      files: {
        image: [{ filename: 'test_temp_art.png', path: tempFilePath }],
      },
    });

    await artworkController.create(createCtx.req, createCtx.res, (err) => { throw err; });
    const createRes = createCtx.getResult();
    const createdArt = createRes.body?.artwork;

    assert(
      createRes.status === 201 && createdArt?.id && createdArt?.main_image?.includes('res.cloudinary.com') && createdArt?.cloudinary_public_id,
      '1 & 2 & 3. Admin uploads artwork image -> Image uploaded to Cloudinary, secure URL & public_id stored in PostgreSQL',
      `URL: ${createdArt?.main_image}, public_id: ${createdArt?.cloudinary_public_id}`
    );

    // B. Public View Artwork
    const fetchedArt = await artworkModel.findById(createdArt.id);
    assert(
      fetchedArt && fetchedArt.main_image.includes('res.cloudinary.com'),
      '4. Public artwork displays Cloudinary image correctly'
    );

    // C. Edit Artwork Metadata (no image replacement)
    const editCtx = mockReqRes({
      params: { id: createdArt.id },
      body: { title: 'Updated Cloudinary Title' },
      files: {},
    });
    await artworkController.update(editCtx.req, editCtx.res, (err) => { throw err; });
    const editRes = editCtx.getResult();
    assert(
      editRes.status === 200 && editRes.body?.artwork?.title === 'Updated Cloudinary Title' && editRes.body?.artwork?.main_image === createdArt.main_image,
      '5. Admin edits artwork metadata without replacing image (image remains untouched)'
    );

    // D. Edit Artwork with Image Replacement (Old image cleanup)
    const initialPublicId = createdArt.cloudinary_public_id;
    mockDeleteCalledWith = [];
    const replaceTempPath = path.join(__dirname, 'test_replace_art.png');
    fs.writeFileSync(replaceTempPath, dummyImageBytes);

    const replaceCtx = mockReqRes({
      params: { id: createdArt.id },
      body: { title: 'Artwork With Replaced Image' },
      files: {
        image: [{ filename: 'test_replace_art.png', path: replaceTempPath }],
      },
    });

    await artworkController.update(replaceCtx.req, replaceCtx.res, (err) => { throw err; });
    const replaceRes = replaceCtx.getResult();
    const replacedArt = replaceRes.body?.artwork;

    assert(
      replaceRes.status === 200 &&
      replacedArt?.main_image?.includes('res.cloudinary.com') &&
      mockDeleteCalledWith.includes(initialPublicId),
      '6 & 7. Admin replaces image -> new Cloudinary asset saved and old Cloudinary image deleted safely',
      `Old asset deleted: ${JSON.stringify(mockDeleteCalledWith)}`
    );

    // E. Cloudinary Failure Resilience (upload failure must NOT modify artwork)
    cloudinaryConfig.uploadArtworkImage = async () => {
      throw new Error('Cloudinary Connection Timeout');
    };
    const failTempPath = path.join(__dirname, 'test_fail_art.png');
    fs.writeFileSync(failTempPath, dummyImageBytes);

    const failCtx = mockReqRes({
      params: { id: createdArt.id },
      body: { title: 'Should Not Update' },
      files: {
        image: [{ filename: 'test_fail_art.png', path: failTempPath }],
      },
    });

    await artworkController.update(failCtx.req, failCtx.res, (err) => { throw err; });
    const failRes = failCtx.getResult();
    const afterFailArt = await artworkModel.findById(createdArt.id);

    assert(
      failRes.status === 500 && afterFailArt.main_image === replacedArt.main_image,
      '13. Cloudinary upload failure leaves artwork record completely intact and uncorrupted',
      `Status: ${failRes.status}, main_image intact: ${afterFailArt.main_image}`
    );

    // F. Admin Deletes Artwork -> DB record removed and Cloudinary asset cleaned up
    mockDeleteCalledWith = [];
    cloudinaryConfig.uploadArtworkImage = originalUpload; // restore
    const currentPublicId = afterFailArt.cloudinary_public_id;

    const delCtx = mockReqRes({
      params: { id: createdArt.id },
    });
    await artworkController.remove(delCtx.req, delCtx.res, (err) => { throw err; });
    const delRes = delCtx.getResult();
    const afterDelCheck = await artworkModel.findById(createdArt.id);

    assert(
      delRes.status === 200 && afterDelCheck === undefined && mockDeleteCalledWith.includes(currentPublicId),
      '8. Admin deletes artwork -> record removed from PostgreSQL and Cloudinary asset deleted safely',
      `Cleaned assets: ${JSON.stringify(mockDeleteCalledWith)}`
    );

    // Restore original config
    cloudinaryConfig.isConfigured = originalIsConfigured;
    cloudinaryConfig.uploadArtworkImage = originalUpload;
    cloudinaryConfig.deleteArtworkImage = originalDelete;

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log(`\n=== CLOUDINARY INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runCloudinarySuite();
