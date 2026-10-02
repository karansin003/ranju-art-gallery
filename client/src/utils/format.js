export function formatPrice(value) {
  const num = Number(value);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function availabilityLabel(status) {
  const map = { AVAILABLE: 'Available', SOLD: 'Sold', RESERVED: 'Reserved' };
  return map[status] || status;
}

export function statusLabel(status) {
  return status
    ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')
    : '';
}
