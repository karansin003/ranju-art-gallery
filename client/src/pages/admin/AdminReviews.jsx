import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/States.jsx';
import StarRating from '../../components/StarRating.jsx';
import { formatDate } from '../../utils/format';

const TABS = ['PENDING', 'APPROVED', 'REJECTED'];

export default function AdminReviews() {
  const [tab, setTab] = useState('PENDING');
  const [reviews, setReviews] = useState(null);
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });

  function load() {
    api.get(`/reviews/status/${tab}`)
      .then((r) => setReviews(r.data.reviews))
      .catch(() => setReviews([]));

    // Also fetch counts for all tabs
    Promise.all([
      api.get('/reviews/status/PENDING').then((r) => r.data.reviews.length).catch(() => 0),
      api.get('/reviews/status/APPROVED').then((r) => r.data.reviews.length).catch(() => 0),
      api.get('/reviews/status/REJECTED').then((r) => r.data.reviews.length).catch(() => 0),
    ]).then(([p, a, r]) => {
      setCounts({ PENDING: p, APPROVED: a, REJECTED: r });
    });
  }

  useEffect(() => {
    setReviews(null);
    load();
  }, [tab]);

  async function setStatus(id, status) {
    await api.put(`/reviews/${id}/status`, { status });
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this review permanently?')) return;
    await api.delete(`/reviews/${id}`);
    load();
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-rule">
        <h1 className="text-2xl font-display">Customer Reviews Moderation</h1>
        <p className="text-xs text-ink/60 mt-1">
          Submitted reviews stay in PENDING until you approve them for public display on the website.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-8 mb-8 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
              tab === t
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <span>{t.charAt(0) + t.slice(1).toLowerCase()}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
              tab === t ? 'bg-ink text-paper' : 'bg-ink/10 text-ink/60'
            }`}>
              {counts[t] || 0}
            </span>
          </button>
        ))}
      </div>

      {reviews === null ? (
        <Loader />
      ) : reviews.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} reviews.`}
          description={tab === 'PENDING' ? 'New customer reviews will appear here for your moderation.' : ''}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-rule bg-card p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2">
                  <StarRating value={r.rating} />
                  <p className="text-sm text-ink leading-relaxed italic">
                    "{r.review_text}"
                  </p>
                  <p className="text-xs text-ink/60">
                    <span className="font-semibold text-ink">{r.customer_name}</span> · {formatDate(r.created_at)}
                    {r.artwork_title && (
                      <span className="ml-1 text-ochre-dark">
                        · In review of: <strong>{r.artwork_title}</strong>
                      </span>
                    )}
                  </p>
                </div>

                {/* Moderation Actions */}
                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 pt-2 sm:pt-0">
                  {tab !== 'APPROVED' && (
                    <button
                      onClick={() => setStatus(r.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-moss text-paper hover:bg-moss/90 font-medium"
                    >
                      ✓ Approve
                    </button>
                  )}
                  {tab !== 'REJECTED' && (
                    <button
                      onClick={() => setStatus(r.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-ink/10 text-ink hover:bg-ink hover:text-paper font-medium"
                    >
                      ✕ Reject
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    className="px-3 py-1.5 text-red-700 hover:text-red-900 underline text-xs ml-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
