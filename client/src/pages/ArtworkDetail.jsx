import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../hooks/useSettings.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { Loader, ErrorState } from '../components/States.jsx';
import { formatPrice, availabilityLabel } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';

export default function ArtworkDetail() {
  const { id } = useParams();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setData(null);
    setError(null);
    api.get(`/artworks/${id}`)
      .then((r) => {
        setData(r.data);
        setActiveImage(r.data.artwork.main_image);
      })
      .catch(() => setError('This artwork could not be found.'));
  }, [id]);

  if (error) {
    return (
      <div className="section py-20 text-center">
        <ErrorState message={error} />
        <Link to="/gallery" className="btn-primary mt-6 inline-flex">
          Browse All Artwork
        </Link>
      </div>
    );
  }

  if (!data) return <Loader />;

  const { artwork, images = [], related = [] } = data;
  const isAvailable = artwork.availability === 'AVAILABLE';
  const isSold = artwork.availability === 'SOLD';
  const isReserved = artwork.availability === 'RESERVED';
  const allImages = [artwork.main_image, ...images.map((i) => i.image_url)].filter(Boolean);

  const whatsappMessage = encodeURIComponent(
    `Hello! I'm interested in your original painting "${artwork.title}" (Artwork #${artwork.id}). Is it still available?`
  );
  const whatsappUrl = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  return (
    <div className="section py-12 md:py-16">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-ink/50 mb-8 flex items-center gap-2">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/gallery" className="hover:text-ink">Gallery</Link>
        <span>/</span>
        <span className="text-ink font-medium truncate">{artwork.title}</span>
      </nav>

      <div className="grid md:grid-cols-12 gap-10 lg:gap-14">
        {/* Left: Gallery Images */}
        <div className="md:col-span-7 space-y-4">
          <div
            className="border border-rule bg-card overflow-hidden cursor-zoom-in group relative"
            onClick={() => setLightbox(true)}
          >
            <img
              src={getImageUrl(activeImage)}
              alt={artwork.title}
              className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute bottom-3 right-3 bg-ink/75 text-paper text-[11px] px-2.5 py-1 backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Click to enlarge ⛶
            </div>
          </div>

          {/* Additional Image Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`border-2 transition-all p-0.5 bg-card ${
                    activeImage === img ? 'border-ink scale-105' : 'border-rule/80 hover:border-ink/50'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${artwork.title} view ${idx + 1}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Artwork Details & Purchasing */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-ink/50 uppercase tracking-widest mb-2 font-medium">
                <span>Artwork ID #{artwork.id}</span>
                {artwork.category_name && (
                  <>
                    <span>•</span>
                    <span>{artwork.category_name}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-medium text-ink leading-tight mb-2">
                {artwork.title}
              </h1>
              <p className="text-2xl sm:text-3xl font-serif text-ink">
                {formatPrice(artwork.price)}
              </p>
            </div>

            {/* Availability Pill */}
            <div>
              {isAvailable && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-moss/10 text-moss border border-moss/30 text-xs font-medium tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-moss"></span>
                  AVAILABLE FOR PURCHASE
                </span>
              )}
              {isSold && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink/10 text-ink/70 border border-ink/30 text-xs font-medium tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-ink/40"></span>
                  SOLD OUT
                </span>
              )}
              {isReserved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ochre/10 text-ochre-dark border border-ochre/30 text-xs font-medium tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-ochre-dark"></span>
                  CURRENTLY RESERVED
                </span>
              )}
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="text-ink/75 text-sm sm:text-base leading-relaxed border-t border-rule/60 pt-4">
                <p>{artwork.description}</p>
              </div>
            )}

            {/* Artwork Specifications Table */}
            <div className="border-t border-b border-rule/60 py-4 text-xs sm:text-sm">
              <dl className="grid grid-cols-2 gap-y-3">
                {artwork.medium && (
                  <>
                    <dt className="text-ink/50">Medium</dt>
                    <dd className="font-medium text-ink">{artwork.medium}</dd>
                  </>
                )}
                {artwork.dimensions && (
                  <>
                    <dt className="text-ink/50">Size / Dimensions</dt>
                    <dd className="font-medium text-ink">{artwork.dimensions}</dd>
                  </>
                )}
                {artwork.creation_year && (
                  <>
                    <dt className="text-ink/50">Creation Year</dt>
                    <dd className="font-medium text-ink">{artwork.creation_year}</dd>
                  </>
                )}
                <dt className="text-ink/50">Type</dt>
                <dd className="font-medium text-ink capitalize">{artwork.product_type || 'Original Painting'}</dd>
                <dt className="text-ink/50">Authenticity</dt>
                <dd className="font-medium text-ink">Hand-signed with Certificate</dd>
              </dl>
            </div>

            {/* Primary Action: Buy Now / Sold Notice */}
            <div className="space-y-3 pt-2">
              {isAvailable ? (
                <Link
                  to={`/checkout/${artwork.id}`}
                  className="btn-primary w-full py-4 text-center text-sm font-semibold tracking-wide uppercase"
                >
                  BUY NOW
                </Link>
              ) : (
                <div className="space-y-3">
                  <button
                    disabled
                    className="btn bg-ink/15 text-ink/40 border-transparent w-full py-4 text-center text-sm font-semibold tracking-wide uppercase cursor-not-allowed"
                  >
                    SOLD
                  </button>
                  <p className="text-xs text-ink/60 text-center">
                    This original piece has been acquired. You can commission a similar custom artwork.
                  </p>
                  <Link
                    to="/contact"
                    className="btn-outline w-full py-3 text-center text-xs block"
                  >
                    Request Similar Custom Painting
                  </Link>
                </div>
              )}

              {/* Inquiry & WhatsApp Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/contact"
                  className="btn-outline text-center text-xs py-3 font-medium"
                >
                  CONTACT ARTIST
                </Link>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bg-moss text-paper border-moss hover:bg-moss/90 text-center text-xs py-3 font-medium flex items-center justify-center gap-1.5"
                  >
                    <span>💬</span> WHATSAPP
                  </a>
                ) : (
                  <Link
                    to="/contact"
                    className="btn-outline text-center text-xs py-3 font-medium"
                  >
                    WHATSAPP
                  </Link>
                )}
              </div>
            </div>

            {/* Shipping & Delivery Guarantees */}
            <div className="bg-card/60 border border-rule p-4 space-y-2 text-xs text-ink/70">
              <p className="font-semibold text-ink">Packaging & Delivery Notice</p>
              <p>
                Each artwork is packaged in multi-layered museum-grade cushioning and moisture-resistant crating to ensure pristine delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-paper text-2xl font-light hover:text-ochre"
              aria-label="Close image"
            >
              ✕ Close
            </button>
            <img
              src={getImageUrl(activeImage)}
              alt={artwork.title}
              className="max-w-full max-h-[85vh] object-contain border border-rule/30 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* "More Artwork You May Like" (Related Items) */}
      {related?.length > 0 && (
        <section className="mt-24 pt-16 border-t border-rule">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">From The Same Collection</p>
              <h2 className="text-2xl sm:text-3xl font-display">More Artwork You May Like</h2>
            </div>
            <Link to="/gallery" className="btn-ghost text-xs hidden sm:inline-flex">
              Explore All Artwork →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
