import './RatingBadge.css';
import type { RatingBadgeProps } from '@website-builder/shared';

function renderStars(rating: number) {
    const full = Math.floor(rating);
    const fractional = rating - full;
    const stars = [];
    for (let i = 0; i < 5; i++) {
        const filled = i < full ? 1 : i === full ? fractional : 0;
        stars.push(
            <span key={i} className="rating_badge__star-wrap">
                <span className="rating_badge__star rating_badge__star--bg">★</span>
                <span
                    className="rating_badge__star rating_badge__star--fg"
                    style={{ width: `${filled * 100}%` }}
                >★</span>
            </span>
        );
    }
    return stars;
}

export default function RatingBadge({ rating, reviewCount, source, align }: RatingBadgeProps) {
    return (
        <div className={`section rating_badge rating_badge--align-${align}`}>
            <div className="rating_badge__inner">
                <span className="rating_badge__stars" aria-label={`${rating} out of 5`}>
                    {renderStars(rating)}
                </span>
                <span className="rating_badge__value">{rating.toFixed(1)} / 5</span>
                {typeof reviewCount === 'number' && (
                    <span className="rating_badge__count">({reviewCount.toLocaleString()} reviews)</span>
                )}
                {source && <span className="rating_badge__source">on {source}</span>}
            </div>
        </div>
    );
}
