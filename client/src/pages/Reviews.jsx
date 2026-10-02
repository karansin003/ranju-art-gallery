import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import StarRating from '../components/StarRating.jsx';
import { Loader, EmptyState, ErrorState } from '../components/States.jsx';
import { formatDate } from '../utils/format';

const EMPTY = { customer_name: '', rating: 5, review_text: '', artwork_id: '' };

export default function Reviews() {
  const [reviews, setReviews] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/reviews')
      .then((r) => setReviews(r.data.reviews))
      .catch(() => setReviews([]));

    api.get('/artworks', { params: { includeAll: true } })
      .then((r) => setArtworks(r.data.artworks))
      .catch(() => {});
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        artwork_id: form.artwork_id ? Number(form.artwork_id) : null,
      };
      const { data } = await api.post('/reviews', payload);
      setResult(data.message);
      setForm(EMPTY);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section py-14 md:py-20">
      <div className="max-w-2xl mx-auto text-center mb-14">
        <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Collector Community</p>
        <h1 className="text-4xl sm:text-5xl font-display mb-3">Collector Feedback</h1>
        <p className="text-ink/65 text-sm sm:text-base">
          Read genuine impressions from art collectors across the country, or share your own experience with an acquired piece.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-14 items-start">
        {/* Left Column: Submit Review Form */}
        <div className="lg:col-span-5 bg-card border border-rule p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-xl text-ink">Leave a Review</h2>
            <p className="text-xs text-ink/60 mt-1">
              Share your thoughts on the painting, texture, packaging, or customer service.
            </p>
          </div>

          {result ? (
            <div className="border border-moss/40 bg-moss/10 p-6 text-center space-y-2">
              <span className="text-2xl text-moss">✓</span>
              <p className="font-display text-base text-ink">Review Submitted</p>
              <p className="text-xs text-ink/75">{result}</p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn-outline text-xs mt-3"
              >
                Submit Another Review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Your Name *</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Rating (1 to 5 Stars) *</label>
                <div className="pt-1">
                  <StarRating
                    value={form.rating}
                    onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                    size="text-2xl"
                  />
                </div>
              </div>

              <div>
                <label className="label">Associated Artwork (Optional)</label>
                <select
                  className="input text-xs"
                  value={form.artwork_id}
                  onChange={(e) => setForm((f) => ({ ...f, artwork_id: e.target.value }))}
                >
                  <option value="">General / Studio Review</option>
                  {artworks.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Your Experience / Review *</label>
                <textarea
                  className="input"
                  rows={4}
                  required
                  placeholder="Describe the colors in person, brush texture, delivery speed, and how it looks in your home…"
                  value={form.review_text}
                  onChange={(e) => setForm((f) => ({ ...f, review_text: e.target.value }))}
                />
              </div>

              {error && <ErrorState message={error} />}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3.5 text-xs uppercase font-semibold tracking-wider"
              >
                {submitting ? 'Submitting Review…' : 'SUBMIT REVIEW'}
              </button>

              <p className="text-[11px] text-ink/50 text-center">
                Reviews are reviewed by the artist before appearing publicly.
              </p>
            </form>
          )}
        </div>

        {/* Right Column: List of Approved Reviews */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <h2 className="font-display text-xl text-ink">Collector Words</h2>
            {reviews && (
              <span className="text-xs text-ink/50">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          {reviews === null ? (
            <Loader />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No published reviews yet."
              description="Be the first collector to share your impressions."
            />
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-rule/70 pb-6 space-y-2">
                  <StarRating value={r.rating} />
                  <p className="text-sm sm:text-base text-ink/80 leading-relaxed italic">
                    "{r.review_text}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink/50 pt-1">
                    <div>
                      <span className="font-semibold text-ink">{r.customer_name}</span>
                      {r.artwork_title && (
                        <span className="text-ochre-dark ml-1">
                          · Reviewed: <em>{r.artwork_title}</em>
                        </span>
                      )}
                    </div>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
