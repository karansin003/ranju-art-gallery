-- =========================================================
-- Ranju Art Gallery — PostgreSQL / Supabase Schema
-- =========================================================

-- Enable UUID extension if needed in future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- users (admin accounts only)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- categories
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- artworks
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS artworks (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  product_type VARCHAR(20) NOT NULL DEFAULT 'original' CHECK (product_type IN ('original','print','poster','custom')),
  medium VARCHAR(120),
  dimensions VARCHAR(80),
  creation_year SMALLINT,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  main_image VARCHAR(500) NOT NULL,
  availability VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability IN ('AVAILABLE','SOLD','RESERVED')),
  quantity INT NOT NULL DEFAULT 1,          -- originals: 1. prints/posters: stock count
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL DEFAULT 0,           -- optimistic lock, prevents double-sell race
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artworks_availability ON artworks(availability);
CREATE INDEX IF NOT EXISTS idx_artworks_featured ON artworks(featured);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category_id);
CREATE INDEX IF NOT EXISTS idx_artworks_price ON artworks(price);

-- ---------------------------------------------------------
-- artwork_images (extra gallery images per artwork)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS artwork_images (
  id SERIAL PRIMARY KEY,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork_id ON artwork_images(artwork_id);

-- ---------------------------------------------------------
-- orders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(24) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(12) NOT NULL,
  customer_message TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PAYMENT_PENDING' CHECK (payment_status IN ('PAYMENT_PENDING','PAID','FAILED','REFUNDED')),
  order_status VARCHAR(20) NOT NULL DEFAULT 'ORDER_PLACED' CHECK (order_status IN ('ORDER_PLACED','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
  payment_gateway_ref VARCHAR(160),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ---------------------------------------------------------
-- order_items
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE RESTRICT,
  artwork_title_snapshot VARCHAR(160) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ---------------------------------------------------------
-- reviews
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  artwork_id INT REFERENCES artworks(id) ON DELETE SET NULL,
  order_id INT REFERENCES orders(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ---------------------------------------------------------
-- custom_requests
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  artwork_type VARCHAR(120),
  preferred_size VARCHAR(80),
  budget VARCHAR(80),
  message TEXT NOT NULL,
  reference_image VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CONTACTED','IN_DISCUSSION','ACCEPTED','REJECTED','COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);

-- ---------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD','READ','REPLIED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- ---------------------------------------------------------
-- videos
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  youtube_url VARCHAR(300) NOT NULL,
  youtube_video_id VARCHAR(30) NOT NULL,
  description TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value TEXT
);

-- ---------------------------------------------------------
-- triggers for automatic updated_at handling
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_artworks_updated_at ON artworks;
CREATE TRIGGER trg_artworks_updated_at BEFORE UPDATE ON artworks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ---------------------------------------------------------
-- default settings seed (safe to run repeatedly)
-- ---------------------------------------------------------
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('artist_name', 'Ranju Art Gallery'),
  ('artist_bio', 'Independent contemporary artist creating original paintings with deep emotion, rich texture, and atmospheric light.'),
  ('profile_image', ''),
  ('phone', '+91 9717157794'),
  ('email', 'ranjukumari754@gmail.com'),
  ('whatsapp_number', '919717157794'),
  ('instagram_url', 'https://www.instagram.com/ranju_creators'),
  ('youtube_url', 'https://www.youtube.com/@ranju_craft_creater'),
  ('website_logo', ''),
  ('hero_heading', 'Art That Lives Beyond The Canvas'),
  ('hero_description', 'Original artworks created with emotion, detail and imagination.'),
  ('footer_text', 'Original handcrafted fine art. Each piece signed and certified.')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------
-- initial categories seed (safe to run repeatedly)
-- ---------------------------------------------------------
INSERT INTO categories (name, slug) VALUES
  ('Portrait', 'portrait'),
  ('Landscape', 'landscape'),
  ('Abstract', 'abstract'),
  ('Nature', 'nature'),
  ('Custom', 'custom')
ON CONFLICT (slug) DO NOTHING;
