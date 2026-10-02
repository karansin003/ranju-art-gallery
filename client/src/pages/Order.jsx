import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { Loader, ErrorState } from '../components/States.jsx';
import { formatPrice } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  message: '',
};

export default function Order() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [availableArtworks, setAvailableArtworks] = useState([]);
  const [selectedId, setSelectedId] = useState(id || '');
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // If no ID in URL, fetch list of available artworks to choose from
  useEffect(() => {
    if (!id) {
      api.get('/artworks', { params: { availability: 'AVAILABLE' } })
        .then((r) => {
          setAvailableArtworks(r.data.artworks);
          if (r.data.artworks.length > 0) {
            setSelectedId(r.data.artworks[0].id);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  // Load selected artwork
  const targetId = id || selectedId;
  useEffect(() => {
    if (!targetId) return;
    setArtwork(null);
    setLoadError(null);
    api.get(`/artworks/${targetId}`)
      .then((r) => setArtwork(r.data.artwork))
      .catch(() => setLoadError('This artwork could not be found.'));
  }, [targetId]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    if (!form.name.trim()) return 'Full Name is required.';
    if (!form.phone.trim() || form.phone.trim().length < 8) return 'Please enter a valid phone number (at least 8 digits).';
    if (!form.email.trim() || !form.email.includes('@')) return 'Please enter a valid email address.';
    if (!form.address.trim()) return 'Delivery address is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.state.trim()) return 'State is required.';
    if (!form.pincode.trim() || form.pincode.trim().length < 4) return 'Please enter a valid postal pincode.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    const valErr = validate();
    if (valErr) {
      setSubmitError(valErr);
      return;
    }

    if (!artwork || artwork.availability !== 'AVAILABLE') {
      setSubmitError('This artwork is no longer available.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        artworkId: artwork.id,
        quantity: 1,
        ...form,
      });
      navigate(`/order-success?orderNumber=${data.order.order_number}`);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "We couldn't place your order. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="section py-20 text-center">
        <ErrorState message={loadError} />
        <Link to="/gallery" className="btn-primary mt-6 inline-flex">
          Browse Available Artworks
        </Link>
      </div>
    );
  }

  if (!artwork && targetId) return <Loader />;

  return (
    <div className="section py-12 md:py-16">
      {/* Breadcrumb */}
      <nav className="text-xs text-ink/50 mb-8 flex items-center gap-2">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/gallery" className="hover:text-ink">Gallery</Link>
        <span>/</span>
        <span className="text-ink font-medium">Checkout</span>
      </nav>

      <div className="grid md:grid-cols-12 gap-12 items-start">
        {/* Left Column: Customer Form */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Direct from Studio</p>
            <h1 className="text-3xl sm:text-4xl font-display">Acquire Artwork</h1>
            <p className="text-xs sm:text-sm text-ink/65 mt-1">
              Please enter your delivery details below to place your order request.
            </p>
          </div>

          {!id && availableArtworks.length > 0 && (
            <div className="bg-card border border-rule p-4">
              <label className="label">Select Artwork to Purchase</label>
              <select
                className="input"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {availableArtworks.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} — {formatPrice(a.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {artwork && artwork.availability !== 'AVAILABLE' ? (
            <div className="border border-red-300 bg-red-50/50 p-6 space-y-3">
              <p className="font-semibold text-red-800 text-sm">
                This artwork has already been sold.
              </p>
              <p className="text-xs text-red-700">
                Original artworks are one-of-one pieces and cannot be ordered once acquired.
              </p>
              <Link to="/gallery" className="btn-primary text-xs inline-block">
                View Available Works
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    className="input"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Shipping Address *</label>
                <input
                  className="input"
                  required
                  placeholder="House / Flat No., Street, Landmark"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input
                    className="input"
                    required
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">State *</label>
                  <input
                    className="input"
                    required
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Pincode *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. 560001"
                    value={form.pincode}
                    onChange={(e) => update('pincode', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Special Delivery Instructions (Optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any framing requests, gate codes, or delivery notes…"
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                />
              </div>

              {submitError && <ErrorState message={submitError} />}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-4 text-sm font-semibold tracking-wider uppercase"
                >
                  {submitting ? 'Verifying & Placing Order…' : 'PLACE ORDER'}
                </button>
              </div>

              <p className="text-[11px] text-ink/50 text-center">
                🔒 Price and availability are verified server-side with database row-level locking.
              </p>
            </form>
          )}
        </div>

        {/* Right Column: Order Summary */}
        {artwork && (
          <aside className="md:col-span-5 border border-rule bg-card p-6 md:p-8 space-y-6 sticky top-28">
            <h2 className="font-display text-xl pb-3 border-b border-rule">Order Summary</h2>

            <div className="flex gap-4 items-start">
              <img
                src={getImageUrl(artwork.main_image)}
                alt={artwork.title}
                className="w-20 h-24 sm:w-24 sm:h-28 object-cover border border-rule shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <p className="text-xs uppercase text-ochre-dark font-medium tracking-wider">
                  Original Artwork
                </p>
                <h3 className="font-display text-lg font-medium text-ink truncate">
                  {artwork.title}
                </h3>
                <p className="text-xs text-ink/60">{artwork.medium}</p>
                {artwork.dimensions && (
                  <p className="text-xs text-ink/60">{artwork.dimensions}</p>
                )}
              </div>
            </div>

            <dl className="text-sm space-y-3 pt-4 border-t border-rule/70">
              <div className="flex justify-between">
                <dt className="text-ink/60">Artwork Price</dt>
                <dd className="font-medium text-ink">{formatPrice(artwork.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Quantity</dt>
                <dd className="font-medium text-ink">1 (One-of-one Original)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Insured Shipping</dt>
                <dd className="font-medium text-moss">Included</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-rule text-base font-semibold">
                <dt>Total Amount</dt>
                <dd className="text-ink">{formatPrice(artwork.price)}</dd>
              </div>
            </dl>

            <div className="bg-paper border border-rule/60 p-4 text-xs text-ink/70 space-y-1.5">
              <p className="font-semibold text-ink">How payment & delivery work:</p>
              <p>
                1. Once placed, the artwork is immediately reserved in your name and marked SOLD to other visitors.
              </p>
              <p>
                2. The artist will contact you directly via Phone / WhatsApp / Email with personalized tracking and delivery updates.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
