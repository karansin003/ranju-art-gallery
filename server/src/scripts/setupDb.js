const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/db');

async function run() {
  console.log('🔄 Running PostgreSQL / Supabase Database Setup...');
  
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Execute base schema
  await db.rawQuery(sql);
  console.log('✅ Base tables, indices and triggers created/verified.');

  // Verify / seed default admin user
  const [existingUsers] = await db.query('SELECT id, email FROM users LIMIT 1');
  if (!existingUsers.length) {
    const hash = await bcrypt.hash('your_password', 12);
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Ranju Kumar', 'admin@gallery.com', hash, 'admin']
    );
    console.log('✅ Created default admin user (admin@gallery.com / your_password).');
  }

  // Seed initial artworks if table is empty
  const [existingArtworks] = await db.query('SELECT id FROM artworks LIMIT 1');
  if (!existingArtworks.length) {
    const [landscapeCategory] = await db.query("SELECT id FROM categories WHERE slug = 'landscape' LIMIT 1");
    const [portraitCategory] = await db.query("SELECT id FROM categories WHERE slug = 'portrait' LIMIT 1");
    const [abstractCategory] = await db.query("SELECT id FROM categories WHERE slug = 'abstract' LIMIT 1");
    const [natureCategory] = await db.query("SELECT id FROM categories WHERE slug = 'nature' LIMIT 1");

    const catId = (cat) => (cat && cat[0] ? cat[0].id : null);

    const initialArtworks = [
      {
        slug: 'sunset-dreams',
        title: 'Sunset Dreams',
        description: 'A warm, textured study of dusk light over open water, built up in loose oil layers.',
        price: 8500.00,
        product_type: 'original',
        medium: 'Oil on canvas',
        dimensions: '24in x 36in',
        creation_year: 2025,
        category_id: catId(landscapeCategory),
        main_image: 'https://picsum.photos/seed/sunset-dreams/900/1100',
        availability: 'AVAILABLE',
        quantity: 1,
        featured: true,
      },
      {
        slug: 'quiet-mountains',
        title: 'Quiet Mountains',
        description: 'A minimal landscape exploring distance and stillness.',
        price: 6200.00,
        product_type: 'original',
        medium: 'Acrylic on canvas',
        dimensions: '20in x 30in',
        creation_year: 2025,
        category_id: catId(landscapeCategory),
        main_image: 'https://picsum.photos/seed/quiet-mountains/900/1100',
        availability: 'AVAILABLE',
        quantity: 1,
        featured: true,
      },
      {
        slug: 'portrait-in-blue',
        title: 'Portrait in Blue',
        description: 'An expressive portrait study using a limited cool palette.',
        price: 9800.00,
        product_type: 'original',
        medium: 'Oil on canvas',
        dimensions: '18in x 24in',
        creation_year: 2024,
        category_id: catId(portraitCategory),
        main_image: 'https://picsum.photos/seed/portrait-in-blue/900/1100',
        availability: 'SOLD',
        quantity: 0,
        featured: false,
      },
      {
        slug: 'wildflower-field',
        title: 'Wildflower Field',
        description: 'Loose, gestural brushwork capturing a summer meadow.',
        price: 5400.00,
        product_type: 'original',
        medium: 'Acrylic on canvas',
        dimensions: '16in x 20in',
        creation_year: 2025,
        category_id: catId(natureCategory),
        main_image: 'https://picsum.photos/seed/wildflower-field/900/1100',
        availability: 'AVAILABLE',
        quantity: 1,
        featured: true,
      },
      {
        slug: 'fragments-no3',
        title: 'Fragments No. 3',
        description: 'Part of an ongoing abstract series exploring layered geometry.',
        price: 7200.00,
        product_type: 'original',
        medium: 'Mixed media on board',
        dimensions: '24in x 24in',
        creation_year: 2024,
        category_id: catId(abstractCategory),
        main_image: 'https://picsum.photos/seed/fragments-no3/900/1100',
        availability: 'RESERVED',
        quantity: 1,
        featured: false,
      },
      {
        slug: 'coastal-morning',
        title: 'Coastal Morning',
        description: 'A quiet early-morning coastal scene in soft blues and sand tones.',
        price: 6800.00,
        product_type: 'original',
        medium: 'Oil on canvas',
        dimensions: '20in x 24in',
        creation_year: 2025,
        category_id: catId(landscapeCategory),
        main_image: 'https://picsum.photos/seed/coastal-morning/900/1100',
        availability: 'AVAILABLE',
        quantity: 1,
        featured: false,
      },
    ];

    for (const art of initialArtworks) {
      await db.query(
        `INSERT INTO artworks
          (slug, title, description, price, product_type, medium, dimensions, creation_year,
           category_id, main_image, availability, quantity, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (slug) DO NOTHING`,
        [
          art.slug, art.title, art.description, art.price, art.product_type, art.medium,
          art.dimensions, art.creation_year, art.category_id, art.main_image, art.availability,
          art.quantity, art.featured,
        ]
      );
    }
    console.log('✅ Seeded initial artworks collection.');
  }

  // Seed sample video if empty
  const [existingVideos] = await db.query('SELECT id FROM videos LIMIT 1');
  if (!existingVideos.length) {
    await db.query(
      `INSERT INTO videos (title, youtube_url, youtube_video_id, description, featured, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'Painting Sunset Dreams — Timelapse',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'dQw4w9WgXcQ',
        'A timelapse of the full painting process.',
        true,
        1,
      ]
    );
    console.log('✅ Seeded initial video.');
  }

  // Seed approved sample reviews if empty
  const [existingReviews] = await db.query('SELECT id FROM reviews LIMIT 1');
  if (!existingReviews.length) {
    const [sunsetRow] = await db.query("SELECT id FROM artworks WHERE slug = 'sunset-dreams' LIMIT 1");
    const sunsetId = sunsetRow[0] ? sunsetRow[0].id : null;

    await db.query(
      `INSERT INTO reviews (customer_name, rating, review_text, artwork_id, status)
       VALUES
       ($1, $2, $3, $4, 'APPROVED'),
       ($5, $6, $7, NULL, 'APPROVED'),
       ($8, $9, $10, $11, 'PENDING')`,
      [
        'Priya S.', 5, 'Absolutely beautiful work, even better in person. Packaging was excellent too.', sunsetId,
        'Rahul M.', 5, 'Bought a custom piece and the artist nailed the brief perfectly.',
        'Ananya K.', 4, 'Lovely painting, shipping took a little longer than expected.', sunsetId,
      ]
    );
    console.log('✅ Seeded initial reviews.');
  }

  console.log('🎉 Setup complete! Database is ready.');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Database setup failed:', err);
      process.exit(1);
    });
}

module.exports = { run };
