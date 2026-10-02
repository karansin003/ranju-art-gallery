import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../hooks/useSettings.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import StarRating from '../components/StarRating.jsx';
import { Loader } from '../components/States.jsx';
import { formatDate } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';

export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState(null);
  const [videos, setVideos] = useState(null);
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    api.get('/artworks/featured').then((r) => setFeatured(r.data.artworks)).catch(() => setFeatured([]));
    api.get('/videos/featured').then((r) => setVideos(r.data.videos)).catch(() => setVideos([]));
    api.get('/reviews', { params: { limit: 3 } }).then((r) => setReviews(r.data.reviews)).catch(() => setReviews([]));
  }, []);

  const heroArtwork = featured?.[0];

  return (
    <div className="overflow-hidden">
      {/* Editorial Hero Section */}
      <section className="section pt-10 pb-20 md:pt-16 md:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ochre/10 border border-ochre/25 text-ochre-dark text-xs uppercase tracking-widest font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre-dark animate-pulse"></span>
              Original Fine Art & Studio Store
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-medium tracking-tight text-ink leading-[1.05]">
              {settings?.hero_heading || 'Art That Lives Beyond The Canvas'}
            </h1>

            <p className="text-ink/75 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed">
              {settings?.hero_description || 'Original artworks created with emotion, detail and imagination.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/gallery" className="btn-primary">
                Explore Artwork
              </Link>
              <Link to="/contact" className="btn-outline">
                Contact Artist
              </Link>
            </div>

            {/* Gallery Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-rule/70 text-xs text-ink/70">
              <div>
                <p className="font-semibold text-ink text-sm">100% Original</p>
                <p>Signed and certified</p>
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Secure Delivery</p>
                <p>Protective packaging</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-ink text-sm">Custom Art</p>
                <p>Commissions open</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-2 bg-gradient-to-tr from-ochre/20 to-transparent blur-xl opacity-70 pointer-events-none"></div>
              <div className="relative border border-rule bg-card p-3 shadow-xl">
                {heroArtwork ? (
                  <Link to={`/artwork/${heroArtwork.slug || heroArtwork.id}`} className="block group overflow-hidden">
                    <img
                      src={getImageUrl(heroArtwork.main_image)}
                      alt={heroArtwork.title}
                      className="w-full aspect-[4/5] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-display text-sm font-medium text-ink group-hover:text-ochre-dark transition-colors">
                          {heroArtwork.title}
                        </p>
                        <p className="text-ink/60">{heroArtwork.medium || 'Original Artwork'}</p>
                      </div>
                      <span className="font-semibold text-ink">
                        ₹{Number(heroArtwork.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="w-full aspect-[4/5] bg-ink/5 flex items-center justify-center text-ink/40 text-sm">
                    Studio Artwork
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artwork Collection */}
      <section className="section py-20 border-t border-rule">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Curated Selection</p>
            <h2 className="text-3xl sm:text-4xl font-display">Featured Artwork</h2>
          </div>
          <Link to="/gallery" className="btn-ghost text-sm self-start sm:self-auto inline-flex items-center gap-1">
            View full gallery <span>→</span>
          </Link>
        </div>

        {featured === null ? (
          <Loader />
        ) : featured.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-rule">
            <p className="text-ink/60 mb-4">No artworks currently featured.</p>
            <Link to="/gallery" className="btn-primary text-xs">Browse All Artwork</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}
      </section>

      {/* "Want a Custom Painting?" Banner */}
      <section className="section py-16">
        <div className="bg-card border border-rule p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-block text-xs uppercase tracking-widest text-ochre-dark font-semibold">
              Bespoke Commissions
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-ink leading-tight">
              Want a Custom Painting?
            </h2>
            <p className="text-ink/70 text-base leading-relaxed">
              Have a special portrait, memory, or landscape in mind? Commission a personalized, one-of-a-kind original painting made to your specifications of medium, size, and palette.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/contact" className="btn-primary">
                Request Custom Art
              </Link>
              <Link to="/gallery" className="btn-outline">
                See Past Creations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Artist Profile Spotlight */}
      <section className="section py-20 border-t border-rule grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5 order-2 md:order-1">
          <div className="border border-rule bg-card p-3 shadow-md max-w-sm mx-auto md:max-w-none">
            {settings?.profile_image ? (
              <img
                src={getImageUrl(settings.profile_image)}
                alt={settings.artist_name}
                className="w-full aspect-[4/5] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/5] bg-ink/10 flex flex-col items-center justify-center text-ink/40 p-6 text-center">
                <span className="font-display text-2xl text-ink/60 mb-2">{settings?.artist_name || 'The Artist'}</span>
                <span className="text-xs">Original Fine Art Studio</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 order-1 md:order-2 space-y-6">
          <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium">The Studio Philosophy</p>
          <h2 className="text-3xl sm:text-4xl font-display">{settings?.artist_name || 'The Artist'}</h2>
          <p className="text-ink/75 text-base sm:text-lg leading-relaxed">
            {settings?.artist_bio || 'Independent contemporary artist creating original paintings inspired by emotion, detail and imagination.'}
          </p>
          <p className="text-ink/60 text-sm leading-relaxed">
            Every piece is created entirely by hand with artist-grade pigments, heavy linen canvases, and archival protective varnishes to ensure longevity across generations.
          </p>
          <div>
            <Link to="/about" className="btn-outline">
              Read Artist Journey
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube Video Section */}
      {videos?.length > 0 && (
        <section className="section py-20 border-t border-rule">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Process & Timelapses</p>
              <h2 className="text-3xl sm:text-4xl font-display">From The Studio</h2>
            </div>
            {settings?.youtube_url && (
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="btn-outline text-xs self-start sm:self-auto inline-flex items-center gap-2"
              >
                <span>▶</span> Watch on YouTube
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {videos.slice(0, 2).map((v) => (
              <div key={v.id} className="border border-rule bg-card overflow-hidden">
                <div className="aspect-video w-full bg-ink">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${v.youtube_video_id}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-medium line-clamp-1">{v.title}</h3>
                  {v.description && <p className="text-xs text-ink/60 mt-1 line-clamp-2">{v.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instagram Integration Section */}
      <section className="section py-20 border-t border-rule text-center">
        <div className="max-w-xl mx-auto space-y-4 mb-10">
          <div className="w-10 h-10 rounded-full bg-ochre/15 text-ochre-dark flex items-center justify-center mx-auto text-lg">
            📷
          </div>
          <h2 className="text-3xl sm:text-4xl font-display">Follow My Art Journey</h2>
          <p className="text-ink/70 text-sm">
            Catch fresh studio reels, works-in-progress, and announcements on Instagram.
          </p>
          {settings?.instagram_url && (
            <p className="text-xs text-ochre-dark font-semibold tracking-wider uppercase">
              {settings.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '@').replace(/\/$/, '')}
            </p>
          )}
          {settings?.instagram_url && (
            <div>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>View Instagram</span>
                <span>↗</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Collector Reviews */}
      <section className="section py-20 border-t border-rule">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Collector Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-display">What Collectors Say</h2>
          </div>
          <Link to="/reviews" className="btn-ghost text-sm self-start sm:self-auto">
            View all reviews →
          </Link>
        </div>

        {reviews === null ? (
          <Loader />
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-rule">
            <p className="text-ink/60 mb-3">No reviews published yet.</p>
            <Link to="/reviews" className="btn-outline text-xs">Be the first to leave a review</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="border border-rule bg-card p-6 flex flex-col justify-between">
                <div>
                  <StarRating value={r.rating} />
                  <p className="text-sm text-ink/80 mt-4 mb-4 italic leading-relaxed">
                    "{r.review_text}"
                  </p>
                </div>
                <div className="pt-4 border-t border-rule/50 text-xs text-ink/50 flex justify-between items-center">
                  <span className="font-medium text-ink/80">{r.customer_name}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
