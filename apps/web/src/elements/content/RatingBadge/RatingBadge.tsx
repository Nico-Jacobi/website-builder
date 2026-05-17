import './RatingBadge.css';
import { useEditableText } from '../../../builder/useEditableText';
import { StarRating } from '../../shared/StarRating';
import type { RatingBadgeProps } from '@website-builder/shared';

export default function RatingBadge({ rating, reviewCount, source, align }: RatingBadgeProps) {
    const sourceEdit = useEditableText('source');
    return (
        <div className={`section rating_badge rating_badge--align-${align}`}>
            <div className="rating_badge__inner">
                <StarRating
                    rating={rating}
                    fractional
                    className="rating_badge__stars"
                />
                <span className="rating_badge__value">{rating.toFixed(1)} / 5</span>
                {typeof reviewCount === 'number' && (
                    <span className="rating_badge__count">({reviewCount.toLocaleString()} reviews)</span>
                )}
                {source && <span className="rating_badge__source" {...sourceEdit}>on {source}</span>}
            </div>
        </div>
    );
}
