import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings.jsx';

export default function About() {
  const { settings } = useSettings();

  return (
    <div className="section py-14 md:py-20 space-y-16">
      {/* Bio Split Section */}
      <div className="grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5">
          <div className="border border-rule bg-card p-3 shadow-lg max-w-md mx-auto md:max-w-none">
            {settings?.profile_image ? (
              <img
                src={settings.profile_image}
                alt={settings.artist_name}
                className="w-full aspect-[4/5] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/5] bg-ink/10 flex flex-col items-center justify-center p-8 text-center text-ink/40">
                <span className="font-display text-3xl mb-2 text-ink/70">{settings?.artist_name || 'The Artist'}</span>
                <span className="text-xs uppercase tracking-widest">Fine Art Studio</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 space-y-6">
          <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium">About The Artist</p>
          <h1 className="text-4xl sm:text-5xl font-display text-ink leading-tight">
            {settings?.artist_name || 'The Artist'}
          </h1>
          
          <div className="text-ink/80 text-base sm:text-lg leading-relaxed space-y-4">
            <p className="whitespace-pre-line">{settings?.artist_bio}</p>
            <p>
              Working primarily in oils, heavy acrylics, and mixed media, my art explores the interplay between light, silence, and human emotion. Each canvas is approached not merely as an image, but as a textured narrative meant to transform the room it inhabits.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/gallery" className="btn-primary">
              Explore Available Works
            </Link>
            <Link to="/contact" className="btn-outline">
              Commission Custom Piece
            </Link>
          </div>
        </div>
      </div>

      {/* Studio Pillars & Standards */}
      <div className="pt-16 border-t border-rule grid sm:grid-cols-3 gap-8 text-sm">
        <div className="border border-rule bg-card p-6 space-y-3">
          <span className="text-2xl text-ochre-dark">🎨</span>
          <h3 className="font-display text-lg text-ink font-semibold">Archival Grade Materials</h3>
          <p className="text-ink/70 text-xs leading-relaxed">
            Every painting utilizes lightfast artist-grade pigments, heavyweight Belgian linen or cotton duck, and non-yellowing protective varnish to endure decades of display.
          </p>
        </div>

        <div className="border border-rule bg-card p-6 space-y-3">
          <span className="text-2xl text-ochre-dark">📜</span>
          <h3 className="font-display text-lg text-ink font-semibold">Certificate of Authenticity</h3>
          <p className="text-ink/70 text-xs leading-relaxed">
            All original acquisitions include a hand-signed Certificate of Authenticity stating dimensions, medium, title, and studio registration number.
          </p>
        </div>

        <div className="border border-rule bg-card p-6 space-y-3">
          <span className="text-2xl text-ochre-dark">📦</span>
          <h3 className="font-display text-lg text-ink font-semibold">Worldwide Insured Packing</h3>
          <p className="text-ink/70 text-xs leading-relaxed">
            Paintings are carefully cushioned in waterproof wrapping and custom rigid crating. Worldwide insured transit ensures every piece reaches you in mint condition.
          </p>
        </div>
      </div>

      {/* Social Journey Banner */}
      <div className="bg-card border border-rule p-8 sm:p-12 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-display">Watch the Creation Process</h2>
        <p className="text-ink/70 text-sm max-w-lg mx-auto">
          See weekly easel progress, timelapse paintings, and pigment mixing on Instagram and YouTube.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs"
            >
              Instagram Reel Archive ↗
            </a>
          )}
          {settings?.youtube_url && (
            <a
              href={settings.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs"
            >
              YouTube Studio Channel ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
