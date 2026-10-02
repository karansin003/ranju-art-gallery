import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../../services/api';
import { ErrorState, Loader } from '../../components/States.jsx';
import { getImageUrl } from '../../utils/imageUrl';

const MEDIUM_PRESETS = [
  'Oil on Canvas',
  'Acrylic on Canvas',
  'Watercolor on Paper',
  'Charcoal on Paper',
  'Pencil Sketch',
  'Mixed Media on Board',
  'Digital Fine Art',
  'Custom Medium',
];

const EMPTY = {
  title: '',
  description: '',
  price: '',
  product_type: 'original',
  medium: 'Oil on Canvas',
  dimensions: '',
  creation_year: new Date().getFullYear(),
  category_id: '',
  availability: 'AVAILABLE',
  quantity: 1,
  featured: false,
  video_url: '',
  instagram_url: '',
  youtube_url: '',
};

export default function AdminArtworkForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);

  // Main image state
  const [mainFile, setMainFile] = useState(null);
  const [mainPreview, setMainPreview] = useState(null);

  // New gallery images state (to be uploaded)
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Existing gallery images (from DB)
  const [existingImages, setExistingImages] = useState([]);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});

    if (isEdit) {
      setLoading(true);
      api.get(`/artworks/${id}`)
        .then((r) => {
          const a = r.data.artwork;
          setForm({
            title: a.title,
            description: a.description || '',
            price: a.price,
            product_type: a.product_type || 'original',
            medium: a.medium || 'Oil on Canvas',
            dimensions: a.dimensions || '',
            creation_year: a.creation_year || '',
            category_id: a.category_id || '',
            availability: a.availability || 'AVAILABLE',
            quantity: a.quantity ?? 1,
            featured: Boolean(a.featured),
            video_url: a.video_url || '',
            instagram_url: a.instagram_url || '',
            youtube_url: a.youtube_url || '',
          });
          setMainPreview(a.main_image);
          setExistingImages(r.data.images || []);
        })
        .catch((err) => setError(apiErrorMessage(err, 'Failed to load artwork.')))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Handle Main image selection
  function handleMainFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selected main file must be an image (JPEG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be under 12MB.');
      return;
    }

    setError(null);
    setMainFile(file);
    setMainPreview(URL.createObjectURL(file));
  }

  // Handle Multiple Gallery images selection
  function handleGalleryFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    const validPreviews = [];

    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        setError('All gallery files must be images.');
        return;
      }
      if (f.size > 12 * 1024 * 1024) {
        setError('Each image must be under 12MB.');
        return;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setError(null);
    setGalleryFiles((prev) => [...prev, ...validFiles]);
    setGalleryPreviews((prev) => [...prev, ...validPreviews]);
    e.target.value = ''; // reset file input
  }

  function removeNewGalleryFile(index) {
    setGalleryFiles((files) => files.filter((_, i) => i !== index));
    setGalleryPreviews((previews) => previews.filter((_, i) => i !== index));
  }

  async function handleDeleteExistingImage(imageId) {
    if (!window.confirm('Delete this gallery photo?')) return;
    try {
      await api.delete(`/artworks/${id}/images/${imageId}`);
      setExistingImages((imgs) => imgs.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete image.'));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !mainFile) {
      setError('Please upload a main artwork image.');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          body.append(k, v);
        }
      });

      if (mainFile) {
        body.append('image', mainFile);
      }

      galleryFiles.forEach((f) => {
        body.append('gallery_images', f);
      });

      if (isEdit) {
        await api.put(`/artworks/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/artworks', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/admin/artworks');
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save artwork.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">
            {isEdit ? 'Edit Artwork' : '+ Add New Artwork'}
          </h1>
          <p className="text-xs text-ink/60 mt-1">
            Fill in the details below. All changes immediately reflect on the public website.
          </p>
        </div>
        <Link to="/admin/artworks" className="text-xs underline text-ink/70 hover:text-ink">
          ← Cancel and Return
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="label">Artwork Title *</label>
          <input
            className="input"
            required
            placeholder="e.g. Sunset Over Ganges"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        {/* Main Artwork Image */}
        <div className="border border-rule bg-card/60 p-5 space-y-3">
          <label className="label !mb-0 font-semibold text-ink">
            Main Artwork Image {isEdit ? '(Leave blank to keep existing image)' : '*'}
          </label>
          <p className="text-xs text-ink/60">
            High-resolution primary photo of the artwork (JPEG, PNG, WEBP, max 12MB).
          </p>
          <input
            className="input !py-2 bg-white"
            type="file"
            accept="image/*"
            onChange={handleMainFile}
          />
          {mainPreview && (
            <div className="mt-3 relative w-36 aspect-[4/5] border border-rule overflow-hidden bg-card">
              <img src={getImageUrl(mainPreview)} alt="Main preview" className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 bg-ink text-paper text-[10px] px-1.5 py-0.5">
                Main Image
              </div>
            </div>
          )}
        </div>

        {/* Multiple Additional Gallery Images */}
        <div className="border border-rule bg-card/60 p-5 space-y-3">
          <label className="label !mb-0 font-semibold text-ink">
            Additional Gallery Images (Upload Multiple)
          </label>
          <p className="text-xs text-ink/60">
            Angles, close-up texture shots, signature details, or room mockups.
          </p>
          <input
            className="input !py-2 bg-white"
            type="file"
            multiple
            accept="image/*"
            onChange={handleGalleryFiles}
          />

          {/* New previews to be uploaded */}
          {galleryPreviews.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink mb-2">New images to upload:</p>
              <div className="flex flex-wrap gap-3">
                {galleryPreviews.map((prev, idx) => (
                  <div key={idx} className="relative w-24 h-24 border border-rule bg-card group">
                    <img src={prev} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewGalleryFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-700"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing images from DB */}
          {isEdit && existingImages.length > 0 && (
            <div className="pt-3 border-t border-rule/60">
              <p className="text-xs font-medium text-ink mb-2">Existing Gallery Photos:</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative w-24 h-24 border border-rule bg-card group">
                    <img src={getImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(img.id)}
                      className="absolute -top-2 -right-2 bg-ink text-paper rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-700 hover:text-white"
                      title="Delete from artwork"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price & Product Type */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Price in INR (₹) *</label>
            <input
              className="input"
              type="number"
              required
              min="0"
              step="1"
              placeholder="e.g. 8500"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Product Type</label>
            <select
              className="input"
              value={form.product_type}
              onChange={(e) => update('product_type', e.target.value)}
            >
              <option value="original">Original Painting</option>
              <option value="print">Fine Art Print</option>
              <option value="poster">Poster</option>
              <option value="custom">Custom Artwork</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Artwork Story / Description</label>
          <textarea
            className="input"
            rows={4}
            placeholder="Share the inspiration, concept, emotional background, and visual elements of this piece…"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        {/* Medium & Dimensions */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Medium</label>
            <div className="space-y-2">
              <select
                className="input"
                value={MEDIUM_PRESETS.includes(form.medium) ? form.medium : 'Custom Medium'}
                onChange={(e) => {
                  if (e.target.value !== 'Custom Medium') {
                    update('medium', e.target.value);
                  }
                }}
              >
                {MEDIUM_PRESETS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                className="input text-xs"
                placeholder="Or specify custom medium (e.g. Oil & 24K Gold Leaf on Linen)"
                value={form.medium}
                onChange={(e) => update('medium', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Size / Dimensions</label>
            <input
              className="input"
              placeholder="e.g. 24 × 36 inches (60 × 90 cm)"
              value={form.dimensions}
              onChange={(e) => update('dimensions', e.target.value)}
            />
          </div>
        </div>

        {/* Category, Year, Stock Quantity */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Creation Year</label>
            <input
              className="input"
              type="number"
              min="1900"
              max="2100"
              placeholder="e.g. 2025"
              value={form.creation_year}
              onChange={(e) => update('creation_year', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Stock Quantity</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="1 for originals"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
            />
          </div>
        </div>

        {/* Availability & Featured */}
        <div className="grid sm:grid-cols-2 gap-5 items-center border-t border-rule/70 pt-5">
          <div>
            <label className="label">Product Availability *</label>
            <select
              className="input font-medium"
              value={form.availability}
              onChange={(e) => update('availability', e.target.value)}
            >
              <option value="AVAILABLE">AVAILABLE (Customer can purchase)</option>
              <option value="SOLD">SOLD (Customer cannot purchase)</option>
              <option value="RESERVED">RESERVED (Temporarily on hold)</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="featured"
              className="w-4 h-4 accent-ink"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
            />
            <label htmlFor="featured" className="text-sm font-medium text-ink cursor-pointer">
              Feature on Homepage Showcase
            </label>
          </div>
        </div>

        {/* Video & Social Media Links (Optional) */}
        <div className="border-t border-rule/70 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-ink">
              Process Video & Social Links (Optional)
            </h3>
            <span className="text-[11px] text-ink/50">Shown on public artwork page</span>
          </div>

          <div>
            <label className="label">Full Video URL (YouTube, Vimeo, etc.)</label>
            <input
              className="input"
              type="url"
              placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
              value={form.video_url}
              onChange={(e) => update('video_url', e.target.value)}
            />
            <p className="text-[11px] text-ink/50 mt-1">
              Shows a "🎬 View Full Video" button on this painting's page.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Instagram Reel / Post URL</label>
              <input
                className="input"
                type="url"
                placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                value={form.instagram_url}
                onChange={(e) => update('instagram_url', e.target.value)}
              />
              <p className="text-[11px] text-ink/50 mt-1">
                Adds a "📸 View on Instagram" button.
              </p>
            </div>
            <div>
              <label className="label">YouTube Video / Shorts URL</label>
              <input
                className="input"
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                value={form.youtube_url}
                onChange={(e) => update('youtube_url', e.target.value)}
              />
              <p className="text-[11px] text-ink/50 mt-1">
                Adds a "▶ View on YouTube" button.
              </p>
            </div>
          </div>
        </div>

        {error && <ErrorState message={error} />}

        {/* Form Action Buttons: [SAVE ARTWORK] and [CANCEL] */}
        <div className="flex items-center gap-4 pt-4 border-t border-rule">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary py-3.5 px-8 text-sm font-semibold tracking-wider uppercase"
          >
            {submitting ? 'Saving Artwork…' : 'SAVE ARTWORK'}
          </button>
          <Link
            to="/admin/artworks"
            className="btn-outline py-3.5 px-6 text-sm font-medium"
          >
            CANCEL
          </Link>
        </div>
      </form>
    </div>
  );
}
