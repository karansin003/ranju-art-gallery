export default function StarRating({ value, onChange, size = 'text-base' }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <div className={`flex gap-0.5 ${size}`}>
      {stars.map((n) => (
        <button
          type="button"
          key={n}
          disabled={!interactive}
          onClick={() => onChange && onChange(n)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} ${
            n <= value ? 'text-ochre' : 'text-rule'
          }`}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
