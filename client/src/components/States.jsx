export function Loader({ label = 'Loading…' }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-ink/50 text-sm gap-3">
      <div className="w-8 h-8 border-2 border-ink/20 border-t-ochre rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="py-24 text-center border border-dashed border-rule">
      <p className="font-display text-lg mb-1">{title}</p>
      {description && <p className="text-sm text-ink/60">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="py-16 text-center text-sm text-red-700 bg-red-50 border border-red-200">
      {message || 'Something went wrong. Please try again.'}
    </div>
  );
}
