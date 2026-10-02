import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loader } from '../../components/States.jsx';
import { formatPrice, formatDate, statusLabel } from '../../utils/format';

const CARD_DEFS = [
  { key: 'totalArtworks', label: 'Total Artwork', link: '/admin/artworks' },
  { key: 'availableArtworks', label: 'Available Artwork', link: '/admin/artworks' },
  { key: 'soldArtworks', label: 'Sold Artwork', link: '/admin/artworks' },
  { key: 'totalOrders', label: 'Total Orders', link: '/admin/orders' },
  { key: 'pendingOrders', label: 'Pending Orders', link: '/admin/orders' },
  { key: 'completedOrders', label: 'Completed Orders', link: '/admin/orders' },
  { key: 'pendingReviews', label: 'Pending Reviews', link: '/admin/reviews', highlight: true },
  { key: 'customRequests', label: 'Custom Requests', link: '/admin/custom-requests' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  function load() {
    api.get('/admin/dashboard').then((r) => setData(r.data)).catch(() => setData(null));
  }

  useEffect(load, []);

  async function handleApproveReview(id) {
    await api.put(`/reviews/${id}/status`, { status: 'APPROVED' });
    load();
  }

  async function handleRejectReview(id) {
    await api.put(`/reviews/${id}/status`, { status: 'REJECTED' });
    load();
  }

  if (!data) return <Loader />;

  return (
    <div className="space-y-10">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">Studio Overview</h1>
          <p className="text-xs text-ink/60 mt-1">
            Real-time status of your artwork sales, collectors, and pending inquiries.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/artworks/new" className="btn-primary text-xs py-2 px-4">
            + Add Artwork
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-xs py-2 px-4"
          >
            Visit Website ↗
          </a>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CARD_DEFS.map(({ key, label, link, highlight }) => {
          const val = data.cards?.[key] ?? 0;
          return (
            <Link
              key={key}
              to={link}
              className={`border border-rule bg-card p-5 hover:border-ink/40 transition-colors block ${
                highlight && val > 0 ? 'ring-1 ring-ochre' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-2xl sm:text-3xl font-display font-medium text-ink">
                  {val}
                </p>
                {highlight && val > 0 && (
                  <span className="w-2 h-2 rounded-full bg-ochre-dark"></span>
                )}
              </div>
              <p className="text-xs text-ink/65 mt-1 font-medium">{label}</p>
            </Link>
          );
        })}
      </div>

      {/* 3 Sections: Recent Orders, Recent Reviews, Recent Messages */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="border border-rule bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <h2 className="font-display text-base font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs underline text-ochre-dark">
              View All
            </Link>
          </div>
          {data.recentOrders?.length === 0 ? (
            <p className="text-xs text-ink/50 py-4 text-center">No orders recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders?.map((o) => (
                <div key={o.id} className="p-3 border border-rule/60 bg-paper/60 text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="truncate pr-2 font-display">{o.artwork_title || 'Artwork'}</span>
                    <span className="whitespace-nowrap">{formatPrice(o.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-ink/50 text-[11px]">
                    <span>{o.customer_name}</span>
                    <span>{statusLabel(o.order_status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews Awaiting Approval */}
        <div className="border border-rule bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <h2 className="font-display text-base font-semibold">Reviews To Approve</h2>
            <Link to="/admin/reviews" className="text-xs underline text-ochre-dark">
              Manage
            </Link>
          </div>
          {data.recentReviews?.length === 0 ? (
            <p className="text-xs text-ink/50 py-4 text-center">No reviews awaiting approval.</p>
          ) : (
            <div className="space-y-3">
              {data.recentReviews?.map((r) => (
                <div key={r.id} className="p-3 border border-rule/60 bg-paper/60 text-xs space-y-2">
                  <p className="italic text-ink/80">"{r.review_text}"</p>
                  <div className="flex justify-between items-center text-[11px] text-ink/60">
                    <span>{r.customer_name} ({r.rating}★)</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveReview(r.id)}
                        className="text-moss font-semibold hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectReview(r.id)}
                        className="text-red-700 hover:underline"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="border border-rule bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <h2 className="font-display text-base font-semibold">Recent Messages</h2>
            <Link to="/admin/messages" className="text-xs underline text-ochre-dark">
              All Messages
            </Link>
          </div>
          {data.recentMessages?.length === 0 ? (
            <p className="text-xs text-ink/50 py-4 text-center">No contact inquiries yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentMessages?.map((m) => (
                <div key={m.id} className="p-3 border border-rule/60 bg-paper/60 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-ink">{m.name}</span>
                    <span className="text-[10px] text-ink/50">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-ink/70 line-clamp-2 text-[11px]">{m.message}</p>
                  <p className="text-[10px] text-ink/40">{m.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
