const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Strictly map extension to safe image extension only
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      ext = file.mimetype === 'image/png' ? '.png' :
            file.mimetype === 'image/webp' ? '.webp' :
            file.mimetype === 'image/gif' ? '.gif' : '.jpg';
    }
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  const mime = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES[mime] || !ALLOWED_EXTS.includes(ext)) {
    const error = new Error('Only JPEG, PNG, WEBP or GIF images are allowed.');
    error.status = 400;
    return cb(error);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

module.exports = { upload, UPLOAD_DIR };
