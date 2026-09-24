import { StarIcon } from './icons';

// Same five-star row either way — `onChange` present makes it an
// interactive picker (review form), absent makes it a read-only display
// (browse cards, order history).
function StarRating({ value = 0, onChange, size = 16 }) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span className="star-rating" aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => (
          <StarIcon
            key={n}
            width={size}
            height={size}
            className={n <= Math.round(value) ? 'star-filled' : 'star-empty'}
          />
        ))}
      </span>
    );
  }

  return (
    <span className="star-rating star-picker">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
        >
          <StarIcon width={size} height={size} className={n <= value ? 'star-filled' : 'star-empty'} />
        </button>
      ))}
    </span>
  );
}

export default StarRating;
