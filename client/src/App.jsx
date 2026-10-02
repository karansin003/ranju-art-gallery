import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import ArtworkDetail from './pages/ArtworkDetail.jsx';
import Order from './pages/Order.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import Reviews from './pages/Reviews.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Videos from './pages/Videos.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminSetup from './pages/admin/AdminSetup.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminArtworks from './pages/admin/AdminArtworks.jsx';
import AdminArtworkForm from './pages/admin/AdminArtworkForm.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminCustomRequests from './pages/admin/AdminCustomRequests.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminVideos from './pages/admin/AdminVideos.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

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
