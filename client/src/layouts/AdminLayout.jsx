import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/artworks', label: 'Artwork', icon: '🎨' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/reviews', label: 'Reviews', icon: '★' },
  { to: '/admin/custom-requests', label: 'Custom Requests', icon: '✉' },
  { to: '/admin/messages', label: 'Messages', icon: '💬' },
  { to: '/admin/videos', label: 'Videos', icon: '🎬' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-paper text-ink font-body">
      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 border-r border-rule hidden md:flex flex-col bg-card/40">
        <div className="h-20 flex items-center justify-between px-6 border-b border-rule">
          <Link to="/admin/dashboard" className="font-display text-lg tracking-tight">
            Studio Admin
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-ochre-dark hover:underline"
            title="Open customer site in new tab"
          >
            Live Site ↗
          </a>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1.5 text-sm">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm transition-colors text-xs font-medium ${
                  isActive
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink/75 hover:bg-card hover:text-ink'
                }`
              }
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-rule text-sm space-y-2">
          <p className="text-ink/60 text-xs truncate" title={user?.email}>
            Logged in as: <span className="font-medium text-ink">{user?.name || user?.email}</span>
          </p>
          <button
            onClick={handleLogout}
            className="btn-outline w-full text-xs py-2 text-center"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area & Mobile Header */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-rule flex items-center justify-between px-4 bg-paper/95 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-1.5 border border-rule text-sm"
              aria-label="Toggle admin menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            <span className="font-display font-medium">Studio Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="text-xs text-ochre-dark">
              Live ↗
            </a>
            <button onClick={handleLogout} className="text-xs underline text-ink/70">
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-b border-rule bg-card px-4 py-3 grid grid-cols-2 gap-2 text-xs">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2.5 rounded border border-rule/50 ${
                    isActive ? 'bg-ink text-paper font-semibold' : 'bg-paper text-ink/80'
                  }`
                }
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
