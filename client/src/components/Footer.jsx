import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings.jsx';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="border-t border-rule mt-24">
      <div className="section py-14 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg mb-2">{settings?.artist_name}</h3>
          <p className="text-sm text-ink/70 max-w-xs">{settings?.artist_bio}</p>
        </div>

        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-ochre-dark">Home</Link></li>
            <li><Link to="/gallery" className="hover:text-ochre-dark">Gallery</Link></li>
            <li><Link to="/about" className="hover:text-ochre-dark">About</Link></li>
            <li><Link to="/contact" className="hover:text-ochre-dark">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-3">Contact</p>
          <ul className="space-y-2 text-sm text-ink/80">
            {settings?.phone && <li>{settings.phone}</li>}
            {settings?.email && <li>{settings.email}</li>}
          </ul>
          <div className="flex gap-4 mt-4 text-sm">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="hover:text-ochre-dark">
                Instagram
              </a>
            )}
            {settings?.youtube_url && (
              <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="hover:text-ochre-dark">
                YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="section py-5 text-xs text-ink/50 flex flex-col md:flex-row justify-between gap-2">
          <span>{settings?.footer_text}</span>
          <span>© {new Date().getFullYear()} {settings?.artist_name}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
