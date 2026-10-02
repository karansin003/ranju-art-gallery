import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../../services/api';
import { Loader, EmptyState, ErrorState } from '../../components/States.jsx';

const EMPTY = {
  title: '',
  youtube_url: '',
  description: '',
  featured: false,
  display_order: 0,
};

export default function AdminVideos() {
  const [videos, setVideos] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get('/videos')
      .then((r) => setVideos(r.data.videos))
      .catch(() => setVideos([]));
  }

  useEffect(load, []);

  function startEdit(v) {
    setEditingId(v.id);
    setForm({
      title: v.title,
      youtube_url: v.youtube_url,
      description: v.description || '',
      featured: Boolean(v.featured),
      display_order: v.display_order || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/videos/${editingId}`, form);
        setEditingId(null);
      } else {
        await api.post('/videos', form);
      }
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleFeatured(v) {
    await api.put(`/videos/${v.id}`, { featured: !v.featured });
    load();
  }

  async function remove(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await api.delete(`/videos/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">Video & Reel Management</h1>
          <p className="text-xs text-ink/60 mt-1">
            Embed YouTube painting timelapses and studio reels into your website.
          </p>
        </div>
      </div>

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="border border-rule bg-card p-6 mb-10 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-rule">
          <p className="font-display text-lg font-medium text-ink">
            {editingId ? 'Edit Video' : '+ Add YouTube Video'}
          </p>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs underline text-ink/60 hover:text-ink"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Video Title *</label>
            <input
              className="input"
              required
              placeholder="e.g. Painting Oil Sunset on Linen — Timelapse"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">YouTube Video URL *</label>
            <input
              className="input"
              required
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/... or shorts/..."
              value={form.youtube_url}
              onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">Description (Optional)</label>
          <input
            className="input"
            placeholder="Brief notes about the canvas, brushes, or techniques used…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="videoFeatured"
            className="w-4 h-4 accent-ink"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
          />
          <label htmlFor="videoFeatured" className="text-sm font-medium text-ink cursor-pointer">
            Feature this video on Home Page
          </label>
        </div>

        {error && <ErrorState message={error} />}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs uppercase tracking-wider font-semibold py-3 px-6"
          >
            {submitting ? 'Saving…' : editingId ? 'UPDATE VIDEO' : 'ADD VIDEO'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn-outline text-xs py-3 px-5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Videos List */}
      <h2 className="font-display text-xl mb-4">Published Videos</h2>
      {videos === null ? (
        <Loader />
      ) : videos.length === 0 ? (
        <EmptyState title="No videos added yet." description="Paste a YouTube link above to showcase your work." />
      ) : (
        <div className="border border-rule bg-card divide-y divide-rule shadow-sm">
          {videos.map((v) => (
            <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-white/40 transition-colors">
              <img
                src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`}
                alt={v.title}
                className="w-32 aspect-video object-cover border border-rule shrink-0 bg-ink"
              />
              <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink truncate">{v.title}</p>
                  {v.featured && (
                    <span className="text-[10px] bg-ochre-dark text-paper px-2 py-0.5 font-bold uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="text-xs text-ink/60 mt-1 line-clamp-1">{v.description}</p>
                )}
                <a
                  href={v.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-ink/40 hover:underline mt-1 inline-block"
                >
                  {v.youtube_url} ↗
                </a>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-xs">
                <button
                  onClick={() => toggleFeatured(v)}
                  className="btn-outline !py-1 !px-2.5 text-xs"
                >
                  {v.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => startEdit(v)}
                  className="text-ochre-dark font-medium underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(v.id, v.title)}
                  className="text-red-700 hover:text-red-900 underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
