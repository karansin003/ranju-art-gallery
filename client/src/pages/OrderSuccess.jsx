import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../hooks/useSettings.jsx';
import { Loader, ErrorState } from '../components/States.jsx';
import { formatPrice, statusLabel } from '../utils/format';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderNumber = params.get('orderNumber');
  const { settings } = useSettings();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      setError('No order reference was provided.');
      return;
    }
    api.get(`/orders/track/${orderNumber}`)
      .then((r) => setOrder(r.data.order))
      .catch(() => setError("We couldn't find that order reference."));
  }, [orderNumber]);

  if (error) {
    return (
      <div className="section py-20 max-w-lg mx-auto text-center">
        <ErrorState message={error} />
        <Link to="/gallery" className="btn-primary mt-6 inline-flex">
          Return to Gallery
        </Link>
      </div>
    );
  }

  if (!order) return <Loader />;

  const artworkTitle = order.items?.[0]?.artwork_title_snapshot || 'Original Artwork';
  const whatsappMsg = encodeURIComponent(
    `Hello! I just placed Order #${order.order_number} for "${artworkTitle}" on your website. My name is ${order.customer_name}.`
  );
  const whatsappUrl = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMsg}`
    : null;

  return (
    <div className="section py-16 md:py-24 max-w-xl mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-moss/15 text-moss flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
        ✓
      </div>

      <h1 className="text-3xl sm:text-4xl font-display mb-3 text-ink">
        Thank you for your order!
      </h1>
      
      <p className="text-ink/75 text-sm sm:text-base mb-2">
        Dear <span className="font-semibold text-ink">{order.customer_name}</span>, your order has been successfully recorded.
      </p>
      
      <p className="text-ochre-dark text-xs sm:text-sm font-medium mb-8">
        We will contact you shortly regarding delivery.
      </p>

      {/* Order Details Card */}
      <div className="border border-rule bg-card p-6 sm:p-8 text-left text-sm space-y-4 shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-rule/70">
          <span className="text-xs uppercase tracking-wider text-ink/50 font-medium">Order ID</span>
          <span className="font-mono font-bold text-ink">Order #{order.order_number}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-ink/60">Artwork</span>
          <span className="font-medium text-ink">{artworkTitle}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-ink/60">Customer Name</span>
          <span className="text-ink">{order.customer_name}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-ink/60">Amount</span>
          <span className="font-semibold text-ink text-base">{formatPrice(order.total_amount)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-rule/70">
          <span className="text-ink/60">Order Status</span>
          <span className="px-2.5 py-0.5 bg-moss/10 text-moss border border-moss/20 text-xs font-semibold uppercase">
            {statusLabel(order.order_status)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <Link to="/gallery" className="btn-primary">
          Continue Browsing
        </Link>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn bg-moss text-paper border-moss hover:bg-moss/90 inline-flex items-center justify-center gap-2"
          >
            <span>💬</span> Message Artist on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
