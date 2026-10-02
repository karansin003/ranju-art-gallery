const db = require('../config/db');
const orderModel = require('../models/orderModel');
const reviewModel = require('../models/reviewModel');
const customRequestModel = require('../models/customRequestModel');
const contactMessageModel = require('../models/contactMessageModel');

async function overview(req, res, next) {
  try {
    const [artworkRows] = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE availability = 'AVAILABLE')::int AS available,
        COUNT(*) FILTER (WHERE availability = 'SOLD')::int AS sold
      FROM artworks
    `);
    const artworkCounts = artworkRows[0] || { total: 0, available: 0, sold: 0 };

    const [orderRows] = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE order_status = 'ORDER_PLACED')::int AS pending,
        COUNT(*) FILTER (WHERE order_status = 'DELIVERED')::int AS completed
      FROM orders
    `);
    const orderCounts = orderRows[0] || { total: 0, pending: 0, completed: 0 };

    const [pendingReviews, newRequests, recentOrders, recentReviews, unreadMessages, recentMessages] = await Promise.all([
      reviewModel.countPending(),
      customRequestModel.countNew(),
      orderModel.recentForDashboard(5),
      reviewModel.listByStatus('PENDING'),
      contactMessageModel.countUnread(),
      contactMessageModel.recentForDashboard(5),
    ]);

    res.json({
      cards: {
        totalArtworks: Number(artworkCounts.total || 0),
        availableArtworks: Number(artworkCounts.available || 0),
        soldArtworks: Number(artworkCounts.sold || 0),
        totalOrders: Number(orderCounts.total || 0),
        pendingOrders: Number(orderCounts.pending || 0),
        completedOrders: Number(orderCounts.completed || 0),
        pendingReviews: Number(pendingReviews || 0),
        customRequests: Number(newRequests || 0),
        unreadMessages: Number(unreadMessages || 0),
      },
      recentOrders,
      recentReviews: recentReviews.slice(0, 5),
      recentMessages,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
