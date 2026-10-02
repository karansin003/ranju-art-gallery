const videoModel = require('../models/videoModel');

function extractYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  const patterns = [
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const match = str.match(p);
    if (match) return match[1];
  }
  if (/^[\w-]{11}$/.test(str)) return str;
  return null;
}

async function list(req, res, next) {
  try {
    const videos = await videoModel.list();
    res.json({ videos });
  } catch (err) {
    next(err);
  }
}

async function getFeatured(req, res, next) {
  try {
    const videos = await videoModel.getFeatured(4);
    res.json({ videos });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, youtube_url, description, featured, display_order } = req.body;
    const videoId = extractYouTubeId(youtube_url || '');
    if (!title || !videoId) {
      return res.status(400).json({ error: 'A title and a valid YouTube URL are required.' });
    }
    const id = await videoModel.create({
      title, youtube_url, youtube_video_id: videoId, description,
      featured: featured === true || featured === 'true', display_order,
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const body = { ...req.body };
    if (body.youtube_url) {
      const videoId = extractYouTubeId(body.youtube_url);
      if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL.' });
      body.youtube_video_id = videoId;
    }
    if (body.featured !== undefined) body.featured = body.featured === true || body.featured === 'true';
    await videoModel.update(req.params.id, body);
    res.json({ message: 'Video updated.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await videoModel.remove(req.params.id);
    res.json({ message: 'Video deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getFeatured, create, update, remove };
