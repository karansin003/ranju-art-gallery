import { Link } from 'react-router-dom';
import { formatPrice, availabilityLabel } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';

export default function ArtworkCard({ artwork }) {
  const isAvailable = artwork.availability === 'AVAILABLE';
  const isSold = artwork.availability === 'SOLD';
  const isReserved = artwork.availability === 'RESERVED';
  const detailUrl = `/artwork/${artwork.slug || artwork.id}`;
  const checkoutUrl = `/checkout/${artwork.id}`;

  return (
    <div className="group flex flex-col justify-between border border-rule bg-card/60 hover:bg-card transition-all duration-300 hover:shadow-lg hover:border-ink/20">
      <Link to={detailUrl} className="block relative overflow-hidden bg-card aspect-[4/5]">
        <img
          src={getImageUrl(artwork.main_image)}
          alt={artwork.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Availability Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isAvailable && (
            <span className="bg-moss/90 text-white text-[11px] uppercase tracking-wider font-medium px-2.5 py-0.5 shadow-sm">
              Available
            </span>
          )}
          {isSold && (
            <span className="bg-ink/90 text-paper text-[11px] uppercase tracking-wider font-medium px-2.5 py-0.5 shadow-sm">
              SOLD
            </span>
          )}
          {isReserved && (
            <span className="bg-ochre-dark text-paper text-[11px] uppercase tracking-wider font-medium px-2.5 py-0.5 shadow-sm">
              Reserved
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={detailUrl}>
              <h3 className="font-display text-lg text-ink group-hover:text-ochre-dark transition-colors line-clamp-1">
                {artwork.title}
              </h3>
            </Link>
            <p className={`font-medium text-base whitespace-nowrap ${isSold ? 'text-ink/40 line-through' : 'text-ink'}`}>
              {formatPrice(artwork.price)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink/60 mb-4">
            {artwork.medium && <span>{artwork.medium}</span>}
            {artwork.dimensions && (
              <>
                <span>•</span>
                <span>{artwork.dimensions}</span>
              </>
            )}
          </div>
        </div>

        {/* Buttons: [View Artwork] & [Buy Now] */}
        <div className="pt-3 border-t border-rule/60 grid grid-cols-2 gap-2 mt-auto">
          <Link
            to={detailUrl}
            className="btn-outline !px-2 !py-2 text-xs text-center font-medium"
          >
            View Artwork
          </Link>

          {isAvailable ? (
            <Link
              to={checkoutUrl}
              className="btn-primary !px-2 !py-2 text-xs text-center font-medium"
            >
              Buy Now
            </Link>
          ) : (
            <button
              disabled
              className="btn bg-ink/10 text-ink/40 border-transparent !px-2 !py-2 text-xs font-medium cursor-not-allowed uppercase"
            >
              {isSold ? 'Sold' : 'Reserved'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
