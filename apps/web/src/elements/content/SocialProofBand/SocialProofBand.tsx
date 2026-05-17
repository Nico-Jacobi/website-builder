import './SocialProofBand.css';
import { useEditableText } from '../../../builder/useEditableText';
import { StarRating } from '../../shared/StarRating';
import type { SocialProofBandProps } from '@website-builder/shared';

const GRAPHIC_GLYPH: Record<string, string> = {
    rating:  '★',
    magic:   '✨',
    gift:    '🎁',
    trophy:  '🏆',
    none:    '',
};

export default function SocialProofBand({ tagline, rating, reviewCount, avatars, graphic }: SocialProofBandProps) {
    const taglineEdit = useEditableText('tagline');
    return (
        <div className="section social_proof">
            <div className="social_proof__inner">
                {avatars && avatars.length > 0 && (
                    <div className="social_proof__avatars">
                        {avatars.map((avatar, i) => (
                            <img key={i} src={avatar.src} alt={avatar.alt ?? ''} className="social_proof__avatar" />
                        ))}
                    </div>
                )}
                {graphic !== 'none' && graphic !== 'rating' && (
                    <span className="social_proof__graphic" aria-hidden="true">{GRAPHIC_GLYPH[graphic]}</span>
                )}
                {typeof rating === 'number' && (
                    <StarRating rating={rating} className="social_proof__stars" />
                )}
                {typeof rating === 'number' && (
                    <span className="social_proof__rating-value">{rating.toFixed(1)}</span>
                )}
                {typeof reviewCount === 'number' && (
                    <span className="social_proof__review-count">({reviewCount.toLocaleString()} reviews)</span>
                )}
                <span className="social_proof__tagline" {...taglineEdit}>{tagline}</span>
            </div>
        </div>
    );
}
