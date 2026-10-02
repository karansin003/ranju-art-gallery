import { useEffect, useState } from 'react';
import api from '../services/api';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { Loader, EmptyState } from '../components/States.jsx';

const MEDIUMS = [
  'All Mediums',
  'Oil on Canvas',
  'Acrylic on Canvas',
  'Watercolor',
  'Charcoal',
  'Pencil Sketch',
  'Mixed Media',
  'Digital',
];

export default function Gallery() {
  const [artworks, setArtworks] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    medium: '',
    availability: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v && v !== 'All Mediums')
    );
    const timeout = setTimeout(() => {
      api.get('/artworks', { params })
        .then((r) => setArtworks(r.data.artworks))
        .catch(() => setArtworks([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters]);

  function update(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      search: '',
      category: '',
      medium: '',
      availability: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
    });
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.medium || filters.availability || filters.minPrice || filters.maxPrice || filters.sort !== 'newest'
  );

  return (
    <div className="section py-14">
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Original Works & Editions</p>
        <h1 className="text-4xl sm:text-5xl font-display mb-3">Art Gallery</h1>
        <p className="text-ink/65 text-sm sm:text-base">
          Browse original paintings and fine art directly from the artist's studio. Each original is one-of-a-kind.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="border border-rule bg-card/60 p-5 mb-10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <input
              className="input !py-2.5 text-xs w-full pl-8"
              placeholder="Search by title, subject…"
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
            />
            <span className="absolute left-2.5 top-3 text-ink/40 text-xs">🔍</span>
          </div>

          {/* Category Filter */}
          <select
            className="input !py-2.5 text-xs"
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Medium Filter */}
          <select
            className="input !py-2.5 text-xs"
            value={filters.medium}
            onChange={(e) => update('medium', e.target.value)}
          >
            <option value="">All Mediums</option>
            {MEDIUMS.filter(m => m !== 'All Mediums').map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            className="input !py-2.5 text-xs"
            value={filters.availability}
            onChange={(e) => update('availability', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available for Purchase</option>
            <option value="SOLD">Sold Artworks</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>

        {/* Secondary Row: Price Range + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rule/50">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink/60 font-medium">Price (₹):</span>
            <input
              className="input !py-1.5 !px-3 text-xs w-24"
              type="number"
              placeholder="Min"
              min="0"
              value={filters.minPrice}
              onChange={(e) => update('minPrice', e.target.value)}
            />
            <span className="text-ink/40">—</span>
            <input
              className="input !py-1.5 !px-3 text-xs w-24"
              type="number"
              placeholder="Max"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => update('maxPrice', e.target.value)}
            />

            {/* Quick Price shortcuts */}
            <div className="hidden md:flex gap-1 ml-2">
              <button
                type="button"
                onClick={() => { update('minPrice', ''); update('maxPrice', '6000'); }}
                className="px-2 py-1 text-[11px] border border-rule hover:bg-ink hover:text-paper"
              >
                &lt; ₹6K
              </button>
              <button
                type="button"
                onClick={() => { update('minPrice', '6000'); update('maxPrice', '9000'); }}
                className="px-2 py-1 text-[11px] border border-rule hover:bg-ink hover:text-paper"
              >
                ₹6K - ₹9K
              </button>
              <button
                type="button"
                onClick={() => { update('minPrice', '9000'); update('maxPrice', ''); }}
                className="px-2 py-1 text-[11px] border border-rule hover:bg-ink hover:text-paper"
              >
                &gt; ₹9K
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-ink/60 whitespace-nowrap">Sort by:</label>
            <select
              className="input !py-1.5 !px-3 text-xs w-44"
              value={filters.sort}
              onChange={(e) => update('sort', e.target.value)}
            >
              <option value="newest">Newest Creations</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-ochre-dark underline whitespace-nowrap hover:text-ink"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Count Info */}
      {artworks && (
        <div className="flex items-center justify-between text-xs text-ink/50 mb-6">
          <span>Showing {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}</span>
          {hasActiveFilters && <span>Filtered view</span>}
        </div>
      )}

      {/* Artworks Grid */}
      {artworks === null ? (
        <Loader />
      ) : artworks.length === 0 ? (
        <EmptyState
          title="No artworks match your search."
          description="Try broadening your category, medium, or price filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {artworks.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      )}
    </div>
  );
}
