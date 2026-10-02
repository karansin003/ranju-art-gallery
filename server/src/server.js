require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./config/upload');

const authRoutes = require('./routes/authRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customRequestRoutes = require('./routes/customRequestRoutes');
const contactRoutes = require('./routes/contactRoutes');
const videoRoutes = require('./routes/videoRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// CORS configuration: In unified deployment, frontend & backend share the same domain
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5050',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production' ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploaded images directly
app.use('/uploads', express.static(UPLOAD_DIR));

// ----------------------------------------------------
// API Routes (Registered BEFORE static & SPA fallback)
// ----------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/settings', settingsRoutes);

// Explicit 404 for unmatched /api routes — never return React SPA HTML for APIs
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Resource not found.' });
});

// ----------------------------------------------------
// Frontend Static Assets & SPA Fallback (Production)
// ----------------------------------------------------
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const indexPath = path.join(clientDistPath, 'index.html');

// Serve static assets from client/dist (JS, CSS, SVGs, images)
app.use(express.static(clientDistPath));

// For all other GET requests, serve React's index.html (SPA client-side routing)
app.get('*', (req, res, next) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Fallback when client/dist is not built
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
