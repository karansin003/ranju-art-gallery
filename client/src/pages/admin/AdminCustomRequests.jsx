import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/States.jsx';
import { formatDate } from '../../utils/format';
import { getImageUrl } from '../../utils/imageUrl';

const STATUSES = [
  'NEW',
  'CONTACTED',
  'IN_DISCUSSION',
  'ACCEPTED',
  'COMPLETED',
  'REJECTED',
];

export default function AdminCustomRequests() {
  const [requests, setRequests] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  function load() {
    api.get('/custom-requests')
      .then((r) => setRequests(r.data.requests))
      .catch(() => setRequests([]));
  }

  useEffect(load, []);

  async function setStatus(id, status) {
    try {
      await api.put(`/custom-requests/${id}/status`, { status });
      load();
    } catch (e) {
      alert('Could not update status: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-rule">
        <h1 className="text-2xl font-display">Custom Art Commission Requests</h1>
        <p className="text-xs text-ink/60 mt-1">
          Inquiries submitted via "Want a Custom Painting?". Contact clients directly to discuss canvas sizing and pricing.
        </p>
      </div>

      {requests === null ? (
        <Loader />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No custom requests yet."
          description="Inquiries from collectors will appear here."
        />
      ) : (
        <div className="space-y-6">
          {requests.map((r) => {
            const cleanPhone = r.phone?.replace(/\D/g, '') || '';
            return (
              <div key={r.id} className="border border-rule bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule/60">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-medium text-lg text-ink">
                        {r.name}
                      </span>
                      <span className="text-xs text-ink/50">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 mt-0.5">
                      Requested: <strong className="text-ink">{r.artwork_type || 'Custom Piece'}</strong>
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink/50 uppercase tracking-wider">Status:</span>
                    <select
                      className={`text-xs py-1.5 px-3 border rounded font-semibold ${
                        r.status === 'NEW'
                          ? 'bg-ochre/15 text-ochre-dark border-ochre/30'
                          : r.status === 'ACCEPTED' || r.status === 'COMPLETED'
                          ? 'bg-moss/10 text-moss border-moss/30'
                          : r.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-white text-ink border-rule'
                      }`}
                      value={r.status}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-paper/60 p-4 border border-rule/40">
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase tracking-wider">Phone / WhatsApp</span>
                    <span className="font-medium text-ink">{r.phone}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase tracking-wider">Email</span>
                    <span className="font-medium text-ink">{r.email}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase tracking-wider">Preferred Size</span>
                    <span className="font-medium text-ink">{r.preferred_size || 'Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase tracking-wider">Budget Estimate</span>
                    <span className="font-medium text-ink">{r.budget || 'Not specified'}</span>
                  </div>
                </div>

                {/* Description & Reference */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink/50 font-medium mb-1">
                      Collector's Description & Vision:
                    </p>
                    <p className="text-xs sm:text-sm text-ink/80 leading-relaxed bg-white/50 p-3 border border-rule/30">
                      {r.message}
                    </p>
                  </div>

                  {r.reference_image && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink/50 font-medium mb-1">
                        Attached Reference Image (Click to enlarge):
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(r.reference_image)}
                        className="border border-rule overflow-hidden block w-28 h-28 hover:opacity-90"
                      >
                        <img
                          src={getImageUrl(r.reference_image)}
                          alt="Reference from client"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Action Contacts */}
                <div className="pt-2 flex flex-wrap gap-3">
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${r.name}, thank you for your custom artwork request regarding "${r.artwork_type || 'custom painting'}". I would love to discuss your vision!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn bg-moss text-paper border-moss hover:bg-moss/90 text-xs py-2 px-4 font-medium flex items-center gap-1.5"
                    >
                      <span>💬</span> WhatsApp Client
                    </a>
                  )}
                  <a
                    href={`mailto:${r.email}?subject=Regarding your Custom Art Request&body=${encodeURIComponent(`Dear ${r.name},\n\nThank you for reaching out regarding a custom ${r.artwork_type || 'painting'}.\n\n`)}`}
                    className="btn-outline text-xs py-2 px-4 font-medium"
                  >
                    Send Email
                  </a>
                  <a
                    href={`tel:${r.phone}`}
                    className="btn-ghost text-xs py-2 px-3"
                  >
                    Call Client
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reference Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-paper text-2xl"
            >
              ✕ Close
            </button>
            <img
              src={getImageUrl(selectedImage)}
              alt="Reference Preview"
              className="max-w-full max-h-[80vh] object-contain border border-rule/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}
