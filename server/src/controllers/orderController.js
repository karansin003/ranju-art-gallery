const orderModel = require('../models/orderModel');
const artworkModel = require('../models/artworkModel');

async function create(req, res, next) {
  try {
    const { artworkId, quantity, name, phone, email, address, city, state, pincode, message } = req.body;

    if (!artworkId || !name || !phone || !email || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const qty = Number(quantity) || 1;

    // IMPORTANT: price and availability are re-verified server-side inside
    // placeOrder — the client-submitted total is never trusted.
    const order = await orderModel.placeOrder(
      { artworkId, quantity: qty, customer: { name, phone, email, address, city, state, pincode, message } },
      artworkModel
    );

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function getByOrderNumber(req, res, next) {
  try {
    const order = await orderModel.findByOrderNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Public confirmation view — strip anything not needed to show the
    // customer their own confirmation (keeps this endpoint safe to be
    // unauthenticated since order numbers are unguessable, but we still
    // don't leak full address details wide open).
    res.json({
      order: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        order_status: order.order_status,
        payment_status: order.payment_status,
        items: order.items,
        created_at: order.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, paymentStatus, search } = req.query;
    const orders = await orderModel.list({ status, paymentStatus, search });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { orderStatus, paymentStatus } = req.body;
    await orderModel.updateStatus(req.params.id, { orderStatus, paymentStatus });
    const order = await orderModel.findById(req.params.id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getByOrderNumber, list, getOne, updateStatus };
