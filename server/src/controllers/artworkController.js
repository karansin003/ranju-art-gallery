const slugify = require('slugify');
const path = require('path');
const fs = require('fs');
const artworkModel = require('../models/artworkModel');
const { UPLOAD_DIR } = require('../config/upload');
const cloudinaryConfig = require('../config/cloudinary');

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

    let main_image = `/uploads/${mainImageFile.filename}`;
    let cloudinary_public_id = null;

    if (cloudinaryConfig.isConfigured()) {
      try {
        const uploadRes = await cloudinaryConfig.uploadArtworkImage(mainImageFile.path);
        main_image = uploadRes.url;
        cloudinary_public_id = uploadRes.public_id;
        try { fs.unlinkSync(mainImageFile.path); } catch (_) {}
      } catch (uploadErr) {
        try { fs.unlinkSync(mainImageFile.path); } catch (_) {}
        console.error('Cloudinary main image upload failed:', uploadErr.message);
        return res.status(500).json({ error: 'Image upload to Cloudinary failed. Please try again.' });
      }
    }

    const slugBase = slugify(body.title, { lower: true, strict: true });
    const slug = `${slugBase}-${Date.now().toString(36)}`;

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
      cloudinary_public_id,
      availability: body.availability || 'AVAILABLE',
      quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
      featured: body.featured === 'true' || body.featured === true,
      video_url: body.video_url?.trim() || null,
      instagram_url: body.instagram_url?.trim() || null,
      youtube_url: body.youtube_url?.trim() || null,
    });

    // Handle additional gallery images
    if (req.files?.gallery_images?.length) {
      const extraImages = [];
      for (const gFile of req.files.gallery_images) {
        if (cloudinaryConfig.isConfigured()) {
          try {
            const gUpload = await cloudinaryConfig.uploadArtworkImage(gFile.path);
            extraImages.push({ url: gUpload.url, public_id: gUpload.public_id });
            try { fs.unlinkSync(gFile.path); } catch (_) {}
          } catch (gErr) {
            try { fs.unlinkSync(gFile.path); } catch (_) {}
            console.error('Gallery image Cloudinary upload failed:', gErr.message);
          }
        } else {
          extraImages.push({ url: `/uploads/${gFile.filename}`, public_id: null });
        }
      }
      if (extraImages.length) {
        await artworkModel.addImages(id, extraImages);
      }
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
    let newMainImage = null;
    let newCloudinaryPublicId = null;

    if (mainImageFile) {
      if (cloudinaryConfig.isConfigured()) {
        try {
          const uploadRes = await cloudinaryConfig.uploadArtworkImage(mainImageFile.path);
          newMainImage = uploadRes.url;
          newCloudinaryPublicId = uploadRes.public_id;
          try { fs.unlinkSync(mainImageFile.path); } catch (_) {}
        } catch (uploadErr) {
          try { fs.unlinkSync(mainImageFile.path); } catch (_) {}
          console.error('Cloudinary image replacement upload failed:', uploadErr.message);
          return res.status(500).json({ error: 'New image upload failed. Artwork was not modified.' });
        }
      } else {
        newMainImage = `/uploads/${mainImageFile.filename}`;
      }
      body.main_image = newMainImage;
      body.cloudinary_public_id = newCloudinaryPublicId;
    }

    await artworkModel.update(id, body);

    // Only AFTER successful DB update, clean up old image asset
    if (mainImageFile) {
      if (existing.cloudinary_public_id && existing.cloudinary_public_id !== newCloudinaryPublicId) {
        await cloudinaryConfig.deleteArtworkImage(existing.cloudinary_public_id);
      } else if (existing.main_image?.startsWith('/uploads/')) {
        const oldFile = path.join(UPLOAD_DIR, path.basename(existing.main_image));
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (_) {}
        }
      }
    }

    // Handle additional gallery images
    if (req.files?.gallery_images?.length) {
      const extraImages = [];
      for (const gFile of req.files.gallery_images) {
        if (cloudinaryConfig.isConfigured()) {
          try {
            const gUpload = await cloudinaryConfig.uploadArtworkImage(gFile.path);
            extraImages.push({ url: gUpload.url, public_id: gUpload.public_id });
            try { fs.unlinkSync(gFile.path); } catch (_) {}
          } catch (gErr) {
            try { fs.unlinkSync(gFile.path); } catch (_) {}
            console.error('Gallery image Cloudinary upload failed:', gErr.message);
          }
        } else {
          extraImages.push({ url: `/uploads/${gFile.filename}`, public_id: null });
        }
      }
      if (extraImages.length) {
        await artworkModel.addImages(id, extraImages);
      }
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
    const deletedImg = await artworkModel.deleteGalleryImage(id, imageId);
    if (!deletedImg) return res.status(404).json({ error: 'Image not found.' });

    // Clean up asset from Cloudinary or local disk
    if (deletedImg.cloudinary_public_id) {
      await cloudinaryConfig.deleteArtworkImage(deletedImg.cloudinary_public_id);
    } else if (deletedImg.image_url?.startsWith('/uploads/')) {
      const filename = path.basename(deletedImg.image_url);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
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

    const galleryImages = await artworkModel.getImages(id);

    // Delete from database
    await artworkModel.remove(id);

    // Idempotent and safe asset cleanup
    if (existing.cloudinary_public_id) {
      await cloudinaryConfig.deleteArtworkImage(existing.cloudinary_public_id);
    } else if (existing.main_image?.startsWith('/uploads/')) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(existing.main_image));
      if (fs.existsSync(oldFile)) {
        try { fs.unlinkSync(oldFile); } catch (_) {}
      }
    }

    for (const gImg of galleryImages) {
      if (gImg.cloudinary_public_id) {
        await cloudinaryConfig.deleteArtworkImage(gImg.cloudinary_public_id);
      } else if (gImg.image_url?.startsWith('/uploads/')) {
        const oldFile = path.join(UPLOAD_DIR, path.basename(gImg.image_url));
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (_) {}
        }
      }
    }

    res.json({ message: 'Artwork deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getFeatured, getOne, create, update, updateAvailability, removeGalleryImage, remove };

