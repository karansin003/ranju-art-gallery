require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5050';

async function runTests() {
  console.log('=== STARTING COMPLETE PRODUCTION SECURITY AUDIT TEST SUITE ===\n');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET not found in environment.');
    process.exit(1);
  }

  // Tokens for testing
  const adminToken = jwt.sign({ id: 1, email: 'admin@gallery.com', role: 'admin' }, jwtSecret, { expiresIn: '1h' });
  const normalUserToken = jwt.sign({ id: 99, email: 'customer@example.com', role: 'user' }, jwtSecret, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: 1, email: 'admin@gallery.com', role: 'admin' }, jwtSecret, { expiresIn: '-10s' });
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Normal user -> admin API (Must return 401/403)
    const res1 = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(res1.status === 403, '1. Normal user -> admin API returns 403 Forbidden', `Got status ${res1.status}`);

    // 2. Logged-out user -> admin API (Must return 401)
    const res2 = await fetch(`${BASE_URL}/api/admin/dashboard`);
    assert(res2.status === 401, '2. Logged-out user -> admin API returns 401 Unauthorized', `Got status ${res2.status}`);

    // 3. Normal user -> delete artwork (Must fail: 401/403)
    const res3 = await fetch(`${BASE_URL}/api/artworks/1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(res3.status === 403, '3. Normal user -> delete artwork returns 403 Forbidden', `Got status ${res3.status}`);

    // 4. Normal user -> edit artwork (Must fail: 401/403)
    const res4 = await fetch(`${BASE_URL}/api/artworks/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert(res4.status === 403, '4. Normal user -> edit artwork returns 403 Forbidden', `Got status ${res4.status}`);

    // 5. Normal user -> change price (Must fail: 401/403)
    const res5 = await fetch(`${BASE_URL}/api/artworks/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`,
      },
      body: JSON.stringify({ price: 0.01 }),
    });
    assert(res5.status === 403, '5. Normal user -> change price returns 403 Forbidden', `Got status ${res5.status}`);

    // 6. Normal user -> change site settings (Must fail: 401/403)
    const res6 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`,
      },
      body: JSON.stringify({ site_title: 'Defaced Site' }),
    });
    assert(res6.status === 403, '6. Normal user -> change site settings returns 403 Forbidden', `Got status ${res6.status}`);

    // 7. Admin -> artwork CRUD (Must work)
    // Create test artwork with new video/social fields
    const form = new FormData();
    form.append('title', 'Security Test Artwork ' + Date.now());
    form.append('price', '2500');
    form.append('description', 'Created during automated security testing.');
    form.append('video_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    form.append('instagram_url', 'https://www.instagram.com/reel/C7xY9Z');
    form.append('youtube_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    // dummy 1x1 png image blob
    const dummyImageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const blob = new Blob([dummyImageBytes], { type: 'image/png' });
    form.append('image', blob, 'test.png');

    const resCreate = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    const createData = await resCreate.json();
    const createdId = createData?.artwork?.id;
    assert(resCreate.status === 201 && createdId, '7a. Admin -> create artwork with video & social links', `Status: ${resCreate.status}`);

    // Edit artwork
    const editForm = new FormData();
    editForm.append('title', 'Security Test Artwork Updated');
    editForm.append('video_url', 'https://www.youtube.com/watch?v=updated');
    const resUpdate = await fetch(`${BASE_URL}/api/artworks/${createdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: editForm,
    });
    assert(resUpdate.status === 200, '7b. Admin -> update artwork', `Status: ${resUpdate.status}`);

    // 8. Public visitor -> view artwork (Must work)
    const resGetOne = await fetch(`${BASE_URL}/api/artworks/${createdId}`);
    const getOneData = await resGetOne.json();
    assert(resGetOne.status === 200 && getOneData?.artwork?.id === createdId, '8. Public visitor -> view artwork works', `Status: ${resGetOne.status}`);

    // 9. Public visitor -> view public artwork video/social links (Must work)
    const art = getOneData?.artwork;
    const hasMedia = art?.video_url === 'https://www.youtube.com/watch?v=updated' &&
                     art?.instagram_url === 'https://www.instagram.com/reel/C7xY9Z' &&
                     art?.youtube_url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    assert(hasMedia, '9. Public visitor -> view public artwork video/social links works', `Media links present: ${JSON.stringify({ v: art?.video_url, i: art?.instagram_url, y: art?.youtube_url })}`);

    // Clean up created test artwork
    const resDelete = await fetch(`${BASE_URL}/api/artworks/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resDelete.status === 200, '7c. Admin -> delete artwork works', `Status: ${resDelete.status}`);

    // 10. SQL injection payloads (Must not execute, parameterized queries safe)
    const sqlPayloads = [
      "' OR 1=1 --",
      "1; DROP TABLE artworks; --",
      "admin'--",
      "UNION SELECT null, username, password FROM users --",
    ];
    let sqlSafe = true;
    for (const payload of sqlPayloads) {
      const sqRes = await fetch(`${BASE_URL}/api/artworks?search=${encodeURIComponent(payload)}`);
      if (sqRes.status >= 500) {
        sqlSafe = false;
        break;
      }
      const sqResOne = await fetch(`${BASE_URL}/api/artworks/${encodeURIComponent(payload)}`);
      const bodyText = await sqResOne.text();
      if (sqResOne.status === 500 && bodyText.includes('syntax error')) {
        sqlSafe = false;
        break;
      }
    }
    assert(sqlSafe, '10. SQL injection payloads safely neutralized by parameterized queries');

    // 11. Oversized upload (Must be rejected)
    const bigBytes = Buffer.alloc(14 * 1024 * 1024, 0); // 14MB (exceeds MAX_UPLOAD_MB=12)
    const bigForm = new FormData();
    bigForm.append('title', 'Big File Test');
    bigForm.append('price', '100');
    bigForm.append('image', new Blob([bigBytes], { type: 'image/jpeg' }), 'large.jpg');
    const resBig = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: bigForm,
    });
    assert(resBig.status === 400 || resBig.status === 413, '11. Oversized upload rejected', `Status: ${resBig.status}`);
    if (resBig.status === 201) {
      const bigData = await resBig.json();
      if (bigData?.artwork?.id) {
        await fetch(`${BASE_URL}/api/artworks/${bigData.artwork.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    }

    // 12. Invalid file type (Must be rejected)
    const badForm = new FormData();
    badForm.append('title', 'Bad File Test');
    badForm.append('price', '100');
    badForm.append('image', new Blob([Buffer.from('<?php echo "evil"; ?>')], { type: 'application/x-php' }), 'exploit.php');
    const resBad = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: badForm,
    });
    assert(resBad.status === 400 || resBad.status === 500, '12. Invalid file type rejected', `Status: ${resBad.status}`);

    // Also test malicious URL protocol rejection (e.g. javascript:alert(1))
    const jsUrlForm = new FormData();
    jsUrlForm.append('title', 'XSS URL Test');
    jsUrlForm.append('price', '100');
    jsUrlForm.append('video_url', 'javascript:alert(document.cookie)');
    jsUrlForm.append('image', blob, 'test.png');
    const resJsUrl = await fetch(`${BASE_URL}/api/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: jsUrlForm,
    });
    assert(resJsUrl.status === 400, '12b. Malicious javascript: URL scheme rejected', `Status: ${resJsUrl.status}`);

    // 13. Attempt to access another user's order (Must fail: 401/403)
    const resOrderList = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    const resOrderGet = await fetch(`${BASE_URL}/api/orders/1`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(resOrderList.status === 403 && resOrderGet.status === 403, '13. Attempt to access another user\'s order fails (403 Forbidden)', `List status: ${resOrderList.status}, Get status: ${resOrderGet.status}`);

    // 14. Invalid/expired token (Must fail: 401)
    const resExpired = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const resInvalid = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    assert(resExpired.status === 401 && resInvalid.status === 401, '14. Invalid/expired token rejected (401 Unauthorized)', `Expired status: ${resExpired.status}, Invalid status: ${resInvalid.status}`);

  } catch (err) {
    console.error('Test suite execution error:', err);
    failed++;
  }

  console.log(`\n=== SECURITY AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
