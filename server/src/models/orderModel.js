const db = require('../config/db');

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ART-${year}-${rand}`;
}

// Places an order inside a DB transaction: locks the artwork row, verifies
// availability, verifies price from the database (never trusts the client),
// creates the order + order_item, and marks the artwork sold/reserved.
async function placeOrder({ artworkId, quantity, customer }, artworkModel) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const reserveResult = await artworkModel.tryReserveForOrder(conn, artworkId);
    if (!reserveResult.ok) {
      await conn.rollback();
      const err = new Error(reserveResult.reason);
      err.status = 409;
      throw err;
    }

    const { artwork } = reserveResult;
    const unitPrice = Number(artwork.price);
    const total = unitPrice * quantity;
    const orderNumber = generateOrderNumber();

    const [orderRows, orderMeta] = await conn.query(
      `INSERT INTO orders
        (order_number, customer_name, customer_phone, customer_email, address, city, state, pincode,
         customer_message, total_amount, payment_status, order_status)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'PAYMENT_PENDING', 'ORDER_PLACED')
       RETURNING id`,
      [
        orderNumber, customer.name, customer.phone, customer.email, customer.address,
        customer.city, customer.state, customer.pincode, customer.message || null, total,
      ]
    );

    const orderId = orderMeta.insertId || (orderRows[0] && orderRows[0].id);

    const [artworkRows] = await conn.query('SELECT title FROM artworks WHERE id = ?', [artworkId]);

    await conn.query(
      `INSERT INTO order_items (order_id, artwork_id, artwork_title_snapshot, unit_price, quantity)
       VALUES (?,?,?,?,?)`,
      [orderId, artworkId, artworkRows[0].title, unitPrice, quantity]
    );

    await conn.commit();
    return { id: orderId, order_number: orderNumber, total_amount: total };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findById(id) {
  const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
  const order = orders[0];
  if (!order) return null;
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  return { ...order, items };
}

async function findByOrderNumber(orderNumber) {
  const [orders] = await db.query('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
  const order = orders[0];
  if (!order) return null;
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  return { ...order, items };
}

async function list({ status, paymentStatus, search } = {}) {
  const where = [];
  const params = [];
  if (status) {
    where.push('o.order_status = ?');
    params.push(status);
  }
  if (paymentStatus) {
    where.push('o.payment_status = ?');
    params.push(paymentStatus);
  }
  if (search) {
    where.push('(o.order_number ILIKE ? OR o.customer_name ILIKE ? OR o.customer_email ILIKE ? OR o.customer_phone ILIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  let sql = `
    SELECT o.*,
      (SELECT artwork_title_snapshot FROM order_items WHERE order_id = o.id LIMIT 1) AS artwork_title
    FROM orders o`;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY o.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

async function updateStatus(id, { orderStatus, paymentStatus }) {
  const fields = [];
  const params = [];
  if (orderStatus) {
    fields.push('order_status = ?');
    params.push(orderStatus);
  }
  if (paymentStatus) {
    fields.push('payment_status = ?');
    params.push(paymentStatus);
  }
  if (!fields.length) return;
  params.push(id);
  await db.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function recentForDashboard(limit = 5) {
  const [rows] = await db.query(
    `SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.order_status, o.created_at,
      (SELECT artwork_title_snapshot FROM order_items WHERE order_id = o.id LIMIT 1) AS artwork_title
     FROM orders o ORDER BY o.created_at DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  placeOrder, findById, findByOrderNumber, list, updateStatus, recentForDashboard,
};
