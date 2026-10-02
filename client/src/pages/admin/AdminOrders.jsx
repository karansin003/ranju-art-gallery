import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/States.jsx';
import { formatPrice, formatDate, statusLabel } from '../../utils/format';

const ORDER_STATUSES = [
  'ORDER_PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const PAYMENT_STATUSES = [
  'PAYMENT_PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [search, setSearch] = useState('');

  function load() {
    api.get('/orders', {
      params: {
        status: filterStatus || undefined,
        paymentStatus: filterPayment || undefined,
        search: search || undefined,
      },
    })
      .then((r) => setOrders(r.data.orders))
      .catch(() => setOrders([]));
  }

  useEffect(load, [filterStatus, filterPayment]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  async function updateStatus(id, patch) {
    try {
      await api.put(`/orders/${id}/status`, patch);
      load();
    } catch (e) {
      alert('Could not update order: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">Order Management</h1>
          <p className="text-xs text-ink/60 mt-1">
            Track customer purchases, update shipping progress, and record payment statuses.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-card p-4 border border-rule">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <input
            className="input !py-1.5 text-xs w-full sm:w-64"
            placeholder="Search order #, customer, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary text-xs !py-1.5 !px-3">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="input !py-1.5 text-xs w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Order Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>

          <select
            className="input !py-1.5 text-xs w-auto"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
          >
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {orders === null ? (
        <Loader />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="Customer orders placed on the website will appear here immediately."
        />
      ) : (
        <div className="border border-rule bg-card overflow-hidden shadow-sm divide-y divide-rule">
          {orders.map((o) => (
            <div key={o.id} className="p-4 sm:p-5 hover:bg-white/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Order Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-ink">
                      #{o.order_number}
                    </span>
                    <span className="text-xs text-ink/50">
                      {formatDate(o.created_at)}
                    </span>
                  </div>
                  <p className="font-medium text-base text-ink">
                    {o.artwork_title || 'Original Artwork'}
                  </p>
                  <p className="text-xs text-ink/70">
                    Customer: <span className="font-semibold text-ink">{o.customer_name}</span> · {o.customer_phone} · {o.customer_email}
                  </p>
                </div>

                {/* Right: Amount & Status Selectors */}
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <span className="font-semibold text-base text-ink mr-2">
                    {formatPrice(o.total_amount)}
                  </span>

                  {/* Order Status */}
                  <div className="flex flex-col text-[10px] text-ink/50">
                    <span>Order Status</span>
                    <select
                      className={`text-xs py-1.5 px-2.5 border rounded font-medium ${
                        o.order_status === 'DELIVERED'
                          ? 'bg-moss/10 text-moss border-moss/30'
                          : o.order_status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-white text-ink border-rule'
                      }`}
                      value={o.order_status}
                      onChange={(e) => updateStatus(o.id, { orderStatus: e.target.value })}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div className="flex flex-col text-[10px] text-ink/50">
                    <span>Payment Status</span>
                    <select
                      className={`text-xs py-1.5 px-2.5 border rounded font-medium ${
                        o.payment_status === 'PAID'
                          ? 'bg-moss/10 text-moss border-moss/30'
                          : o.payment_status === 'FAILED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-ochre/15 text-ochre-dark border-ochre/30'
                      }`}
                      value={o.payment_status}
                      onChange={(e) => updateStatus(o.id, { paymentStatus: e.target.value })}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    className="btn-outline !py-1.5 !px-3 text-xs self-end font-medium"
                  >
                    {expanded === o.id ? 'Hide Details ▲' : 'View Details ▼'}
                  </button>
                </div>
              </div>

              {/* Detailed View */}
              {expanded === o.id && <OrderExpandedDetails id={o.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderExpandedDetails({ id }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data.order));
  }, [id]);

  if (!order) return <p className="text-xs text-ink/50 mt-4">Loading details…</p>;

  const cleanPhone = order.customer_phone?.replace(/\D/g, '') || '';

  return (
    <div className="mt-4 pt-4 border-t border-rule/70 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs bg-paper/50 p-4 border border-rule/50">
      <div>
        <p className="font-semibold text-ink mb-1 uppercase tracking-wider text-[10px] text-ink/50">
          Delivery Address
        </p>
        <p className="font-medium text-ink">{order.customer_name}</p>
        <p className="text-ink/80">{order.address}</p>
        <p className="text-ink/80">{order.city}, {order.state} - {order.pincode}</p>
      </div>

      <div>
        <p className="font-semibold text-ink mb-1 uppercase tracking-wider text-[10px] text-ink/50">
          Direct Customer Contacts
        </p>
        <p className="text-ink/80">Phone: {order.customer_phone}</p>
        <p className="text-ink/80">Email: {order.customer_email}</p>
        <div className="flex gap-2 mt-2">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] px-2 py-0.5 bg-moss text-paper hover:bg-moss/90 inline-block font-medium"
            >
              WhatsApp
            </a>
          )}
          <a
            href={`mailto:${order.customer_email}?subject=Regarding your Order #${order.order_number}`}
            className="text-[11px] px-2 py-0.5 bg-ink text-paper hover:bg-ink/80 inline-block font-medium"
          >
            Send Email
          </a>
        </div>
      </div>

      <div>
        <p className="font-semibold text-ink mb-1 uppercase tracking-wider text-[10px] text-ink/50">
          Customer Note / Delivery Message
        </p>
        <p className="italic text-ink/70">
          {order.customer_message ? `"${order.customer_message}"` : 'No special instructions provided.'}
        </p>
      </div>
    </div>
  );
}
