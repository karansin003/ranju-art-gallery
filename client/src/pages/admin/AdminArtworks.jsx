import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/States.jsx';
import { formatPrice, formatDate } from '../../utils/format';
import { getImageUrl } from '../../utils/imageUrl';

export default function AdminArtworks() {
  const [artworks, setArtworks] = useState(null);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  function load() {
    api.get('/artworks', { params: { includeAll: true } })
      .then((r) => setArtworks(r.data.artworks))
      .catch(() => setArtworks([]));
  }

  useEffect(load, []);

  async function handleAvailabilityChange(id, newStatus) {
    setUpdatingId(id);
    try {
      await api.patch(`/artworks/${id}/availability`, { availability: newStatus });
      load();
    } catch {
      // fallback to put if patch fails
      try {
        await api.put(`/artworks/${id}`, { availability: newStatus });
        load();
      } catch (e) {
        alert('Could not update status: ' + (e.response?.data?.error || e.message));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/artworks/${id}`);
      load();
    } catch (e) {
      alert('Could not delete artwork: ' + (e.response?.data?.error || e.message));
    }
  }

  const filtered = artworks?.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.category_name?.toLowerCase().includes(q) ||
      a.medium?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">Artwork Management</h1>
          <p className="text-xs text-ink/60 mt-1">
            Manage your paintings, update prices, change availability, and control home showcase.
          </p>
        </div>
        <Link
          to="/admin/artworks/new"
          className="btn-primary text-xs uppercase tracking-wider font-semibold py-3 px-5 self-start sm:self-auto"
        >
          + ADD NEW ARTWORK
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <input
          className="input !py-2 text-xs max-w-sm"
          placeholder="Filter by title, medium, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {artworks && (
          <span className="text-xs text-ink/50">
            Total Artworks: {artworks.length}
          </span>
        )}
      </div>

      {artworks === null ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No artworks found."
          description={search ? 'No artworks match your filter.' : 'Add your first artwork to get started.'}
        />
      ) : (
        <div className="border border-rule bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink/5 border-b border-rule text-ink/70 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Image</th>
                <th className="p-3.5">Title & Medium</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Availability</th>
                <th className="p-3.5 text-center">Featured</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/60">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-white/40 transition-colors">
                  {/* Thumbnail */}
                  <td className="p-3.5">
                    <img
                      src={getImageUrl(a.main_image)}
                      alt={a.title}
                      className="w-14 h-16 object-cover border border-rule bg-paper"
                    />
                  </td>

                  {/* Title & Medium */}
                  <td className="p-3.5">
                    <p className="font-medium text-sm text-ink">{a.title}</p>
                    <p className="text-ink/60 text-[11px] mt-0.5">{a.medium || '—'}</p>
                    {a.dimensions && (
                      <p className="text-ink/40 text-[10px]">{a.dimensions}</p>
                    )}
                  </td>

                  {/* Price */}
                  <td className="p-3.5 font-semibold text-ink whitespace-nowrap">
                    {formatPrice(a.price)}
                  </td>

                  {/* Category */}
                  <td className="p-3.5 text-ink/75">
                    {a.category_name || 'Uncategorized'}
                  </td>

                  {/* Availability Dropdown (instant update) */}
                  <td className="p-3.5">
                    <select
                      className={`text-xs py-1 px-2 border rounded font-medium ${
                        a.availability === 'AVAILABLE'
                          ? 'bg-moss/10 text-moss border-moss/30'
                          : a.availability === 'SOLD'
                          ? 'bg-ink/10 text-ink/60 border-ink/20'
                          : 'bg-ochre/15 text-ochre-dark border-ochre/30'
                      }`}
                      disabled={updatingId === a.id}
                      value={a.availability}
                      onChange={(e) => handleAvailabilityChange(a.id, e.target.value)}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="SOLD">SOLD</option>
                      <option value="RESERVED">RESERVED</option>
                    </select>
                  </td>

                  {/* Featured */}
                  <td className="p-3.5 text-center">
                    {a.featured ? (
                      <span className="text-ochre-dark font-bold text-sm" title="Featured on Home">★</span>
                    ) : (
                      <span className="text-ink/20 text-xs">☆</span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="p-3.5 text-ink/50 whitespace-nowrap">
                    {formatDate(a.created_at)}
                  </td>

                  {/* Actions: [VIEW], [EDIT], [DELETE] */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3 font-medium">
                      <Link
                        to={`/artwork/${a.slug || a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-ink/70 hover:text-ink underline"
                        title="View on customer website"
                      >
                        [VIEW]
                      </Link>
                      <Link
                        to={`/admin/artworks/${a.id}`}
                        className="text-xs text-ochre-dark hover:text-ink underline font-semibold"
                        title="Edit artwork details"
                      >
                        [EDIT]
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        className="text-xs text-red-700 hover:text-red-900 underline"
                        title="Delete artwork"
                      >
                        [DELETE]
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
