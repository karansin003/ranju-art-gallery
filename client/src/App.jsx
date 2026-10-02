import { useEffect, lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Loader } from './components/States.jsx';

// Immediate core page for instant hero first paint
import Home from './pages/Home.jsx';

// Secondary customer pages lazy-loaded on demand
const Gallery = lazy(() => import('./pages/Gallery.jsx'));
const ArtworkDetail = lazy(() => import('./pages/ArtworkDetail.jsx'));
const Order = lazy(() => import('./pages/Order.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Reviews = lazy(() => import('./pages/Reviews.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Videos = lazy(() => import('./pages/Videos.jsx'));

// Admin pages lazy-loaded on demand (keeps 11 admin components out of public bundle)
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminSetup = lazy(() => import('./pages/admin/AdminSetup.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminArtworks = lazy(() => import('./pages/admin/AdminArtworks.jsx'));
const AdminArtworkForm = lazy(() => import('./pages/admin/AdminArtworkForm.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews.jsx'));
const AdminCustomRequests = lazy(() => import('./pages/admin/AdminCustomRequests.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages.jsx'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader label="Loading gallery…" />}>
        <Routes>
          {/* Customer site */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            
            {/* Support both /artwork/:id and /art/:id for SEO & clean URLs */}
            <Route path="/artwork/:id" element={<ArtworkDetail />} />
            <Route path="/art/:id" element={<ArtworkDetail />} />
            
            {/* Support /checkout/:id, /checkout, and /order/:id */}
            <Route path="/checkout" element={<Order />} />
            <Route path="/checkout/:id" element={<Order />} />
            <Route path="/order/:id" element={<Order />} />
            
            {/* Support /order-success and /orders/success */}
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders/success" element={<OrderSuccess />} />
            
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin auth (no layout) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />

          {/* Admin dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="artworks" element={<AdminArtworks />} />
            <Route path="artworks/new" element={<AdminArtworkForm />} />
            <Route path="artworks/:id" element={<AdminArtworkForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="custom-requests" element={<AdminCustomRequests />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

function NotFound() {
  return (
    <div className="section py-32 text-center">
      <p className="text-xs uppercase tracking-widest text-ochre mb-3 font-semibold">404 Error</p>
      <h1 className="text-4xl font-display mb-3">Page Not Found</h1>
      <p className="text-ink/60 mb-8 max-w-md mx-auto">
        The artwork or gallery page you are looking for does not exist or may have been moved.
      </p>
      <a href="/gallery" className="btn-primary">
        Return to Gallery
      </a>
    </div>
  );
}
