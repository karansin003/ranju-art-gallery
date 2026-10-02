const slugify = require('slugify');
const path = require('path');
const fs = require('fs');
const artworkModel = require('../models/artworkModel');
const { UPLOAD_DIR } = require('../config/upload');

async function list(req, res, next) {
  try {
    const { search, category, medium, availability, minPrice, maxPrice, sort } = req.query;
    const rows = await artworkModel.list({ search, category, medium, availability, minPrice, maxPrice, sort });
    res.json({ artworks: rows });
  } catch (err) {
    next(err);
  }
}

async function getFeatured(req, res, next) {
  try {
    const rows = await artworkModel.getFeatured(6);
    res.json({ artworks: rows });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    // Supports lookup by numeric id OR SEO slug (/artwork/sunset-dreams).
    const artwork = /^\d+$/.test(id) ? await artworkModel.findById(id) : await artworkModel.findBySlug(id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });

    const [images, related] = await Promise.all([
      artworkModel.getImages(artwork.id),
      artworkModel.getRelated(artwork.id, artwork.category_id, 4),
    ]);

    res.json({ artwork, images, related });
  } catch (err) {
    next(err);
  }
}

function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  const trimmed = string.trim();
  if (!trimmed) return false;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

async function create(req, res, next) {
  try {
    const body = req.body;
    const mainImageFile = req.files?.image?.[0] || req.file;

    if (!body.title || !body.price || !mainImageFile) {
      return res.status(400).json({ error: 'Title, price and a main image are required.' });
    }

    if (body.video_url && !isValidHttpUrl(body.video_url)) {
      return res.status(400).json({ error: 'Video URL must be a valid http:// or https:// link.' });
    }
    if (body.instagram_url && !isValidHttpUrl(body.instagram_url)) {
      return res.status(400).json({ error: 'Instagram URL must be a valid http:// or https:// link.' });
    }
    if (body.youtube_url && !isValidHttpUrl(body.youtube_url)) {
      return res.status(400).json({ error: 'YouTube URL must be a valid http:// or https:// link.' });
    }

    const slugBase = slugify(body.title, { lower: true, strict: true });
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const main_image = `/uploads/${mainImageFile.filename}`;

    const id = await artworkModel.create({
      slug,
      title: body.title,
      description: body.description,
      price: Number(body.price),
      product_type: body.product_type || 'original',
      medium: body.medium,
      dimensions: body.dimensions,
      creation_year: body.creation_year ? Number(body.creation_year) : null,
      category_id: body.category_id ? Number(body.category_id) : null,
      main_image,
      availability: body.availability || 'AVAILABLE',
      quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
      featured: body.featured === 'true' || body.featured === true,
      video_url: body.video_url?.trim() || null,
      instagram_url: body.instagram_url?.trim() || null,
      youtube_url: body.youtube_url?.trim() || null,
    });

    // Handle additional gallery images
    if (req.files?.gallery_images?.length) {
      const urls = req.files.gallery_images.map((f) => `/uploads/${f.filename}`);
      await artworkModel.addImages(id, urls);
    }

    const [artwork, images] = await Promise.all([
      artworkModel.findById(id),
      artworkModel.getImages(id),
    ]);

    res.status(201).json({ artwork, images });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await artworkModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Artwork not found.' });

    const body = { ...req.body };
    if (body.price !== undefined) body.price = Number(body.price);
    if (body.quantity !== undefined) body.quantity = Number(body.quantity);
    if (body.creation_year !== undefined) body.creation_year = Number(body.creation_year) || null;
    if (body.category_id !== undefined) body.category_id = body.category_id ? Number(body.category_id) : null;
    if (body.featured !== undefined) body.featured = body.featured === 'true' || body.featured === true;

    if (body.video_url !== undefined) {
      if (body.video_url && !isValidHttpUrl(body.video_url)) {
        return res.status(400).json({ error: 'Video URL must be a valid http:// or https:// link.' });
      }
      body.video_url = body.video_url?.trim() || null;
    }
    if (body.instagram_url !== undefined) {
      if (body.instagram_url && !isValidHttpUrl(body.instagram_url)) {
        return res.status(400).json({ error: 'Instagram URL must be a valid http:// or https:// link.' });
      }
      body.instagram_url = body.instagram_url?.trim() || null;
    }
    if (body.youtube_url !== undefined) {
      if (body.youtube_url && !isValidHttpUrl(body.youtube_url)) {
        return res.status(400).json({ error: 'YouTube URL must be a valid http:// or https:// link.' });
      }
      body.youtube_url = body.youtube_url?.trim() || null;
    }

    const mainImageFile = req.files?.image?.[0] || req.file;
    if (mainImageFile) {
      body.main_image = `/uploads/${mainImageFile.filename}`;
    }

    await artworkModel.update(id, body);

    // Handle additional gallery images
    if (req.files?.gallery_images?.length) {
      const urls = req.files.gallery_images.map((f) => `/uploads/${f.filename}`);
      await artworkModel.addImages(id, urls);
    }

    const [artwork, images] = await Promise.all([
      artworkModel.findById(id),
      artworkModel.getImages(id),
    ]);

    res.json({ artwork, images });
  } catch (err) {
    next(err);
  }
}

async function updateAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    if (!['AVAILABLE', 'SOLD', 'RESERVED'].includes(availability)) {
      return res.status(400).json({ error: 'Invalid availability status.' });
    }
    await artworkModel.update(id, { availability });
    const artwork = await artworkModel.findById(id);
    res.json({ artwork, message: `Availability set to ${availability}.` });
  } catch (err) {
    next(err);
  }
}

async function removeGalleryImage(req, res, next) {
  try {
    const { id, imageId } = req.params;
    const imageUrl = await artworkModel.deleteGalleryImage(id, imageId);
    if (!imageUrl) return res.status(404).json({ error: 'Image not found.' });

    // Clean up file from disk if local upload
    if (imageUrl.startsWith('/uploads/')) {
      const filename = path.basename(imageUrl);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    res.json({ message: 'Gallery image deleted.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await artworkModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Artwork not found.' });
    await artworkModel.remove(id);
    res.json({ message: 'Artwork deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getFeatured, getOne, create, update, updateAvailability, removeGalleryImage, remove };
