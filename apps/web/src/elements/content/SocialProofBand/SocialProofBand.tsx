import './SocialProofBand.css';
import type { SocialProofBandProps } from '@website-builder/shared';

const GRAPHIC_GLYPH: Record<string, string> = {
    rating:  '★',
    magic:   '✨',
    gift:    '🎁',
    trophy:  '🏆',
    none:    '',
};

function renderStars(rating: number) {
    const full = Math.round(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
        stars.push(
            <span key={i} className={`social_proof__star${i < full ? ' social_proof__star--filled' : ''}`}>★</span>
        );
    }
    return <span className="social_proof__stars" aria-label={`${rating} out of 5`}>{stars}</span>;
}

export default function SocialProofBand({ tagline, rating, reviewCount, avatars, graphic }: SocialProofBandProps) {
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
                {typeof rating === 'number' && renderStars(rating)}
                {typeof rating === 'number' && (
                    <span className="social_proof__rating-value">{rating.toFixed(1)}</span>
                )}
                {typeof reviewCount === 'number' && (
                    <span className="social_proof__review-count">({reviewCount.toLocaleString()} reviews)</span>
                )}
                <span className="social_proof__tagline">{tagline}</span>
            </div>
        </div>
    );
}
