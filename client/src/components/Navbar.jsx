import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings.jsx';
import { getImageUrl } from '../utils/imageUrl';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/videos', label: 'Videos' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-rule">
      <div className="section flex items-center justify-between h-20">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-xl tracking-tight hover:opacity-90 transition-opacity"
          onClick={() => setOpen(false)}
        >
          {settings?.website_logo ? (
            <img
              src={getImageUrl(settings.website_logo)}
              alt={settings.artist_name || 'Logo'}
              className="h-10 max-w-[140px] object-contain"
            />
          ) : (
            <span className="font-display text-xl sm:text-2xl text-ink font-medium">
              {settings?.artist_name || 'Studio Gallery'}
            </span>
          )}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-widest font-medium">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `pb-1 border-b transition-colors ${
                  isActive
                    ? 'border-ochre text-ink font-semibold'
                    : 'border-transparent text-ink/70 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA & Admin Link */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/gallery" className="btn-primary !py-2.5 !px-5 text-xs font-semibold uppercase tracking-wider">
            Explore Gallery
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 text-xl leading-none text-ink border border-rule"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav className="md:hidden border-t border-rule bg-paper px-6 py-6 flex flex-col gap-4 text-sm shadow-xl">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `py-2 text-base font-medium border-b border-rule/50 ${
                  isActive ? 'text-ochre-dark font-semibold' : 'text-ink/80'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2">
            <Link
              to="/gallery"
              className="btn-primary w-full text-center text-xs py-3 font-semibold uppercase tracking-wider block"
              onClick={() => setOpen(false)}
            >
              Explore Gallery
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
