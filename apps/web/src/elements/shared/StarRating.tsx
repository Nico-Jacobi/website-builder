import type { CSSProperties } from 'react';

interface StarRatingProps {
    rating: number;
    fractional?: boolean;
    /** aria-label for the wrapper span. Defaults to "{rating} out of 5". */
    ariaLabel?: string;
    /** CSS class applied to the outer <span> wrapper. */
    className?: string;
    /** Inline style applied to the outer <span> wrapper. */
    style?: CSSProperties;
    /** Font size for the star glyphs. Defaults to "1.1rem". */
    fontSize?: string;
    /** Color for filled stars. Defaults to var(--accent). */
    filledColor?: string;
    /** Color for empty stars. Defaults to var(--border_subtle). */
    emptyColor?: string;
}

/**
 * Renders 5 star glyphs for a 0–5 rating.
 *
 * When `fractional` is true (or when `rating % 1 !== 0`), each star uses the
 * overlay technique: a grey background star with a coloured foreground star
 * clipped to `width: X%` so partial fills are pixel-accurate.
 *
 * When the rating is a whole number (and `fractional` is not forced), the
 * simpler filled/empty boolean approach is used.
 */
export function StarRating({
    rating,
    fractional,
    ariaLabel,
    className,
    style,
    fontSize = '1.1rem',
    filledColor = 'var(--accent)',
    emptyColor = 'var(--border_subtle)',
}: StarRatingProps) {
    const useFractional = fractional ?? rating % 1 !== 0;
    const label = ariaLabel ?? `${rating} out of 5`;

    const wrapperStyle: CSSProperties = {
        display: 'inline-flex',
        gap: '2px',
        ...style,
    };

    if (useFractional) {
        const full = Math.floor(rating);
        const stars = [];
        for (let i = 0; i < 5; i++) {
            const filled = i < full ? 1 : i === full ? rating - full : 0;
            stars.push(
                <span
                    key={i}
                    style={{ position: 'relative', display: 'inline-block', lineHeight: 1, fontSize }}
                >
                    {/* background (empty) star */}
                    <span style={{ color: emptyColor }}>★</span>
                    {/* foreground (filled) star clipped by width */}
                    <span
                        style={{
                            position: 'absolute',
                            inset: 0,
                            color: filledColor,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                            width: `${filled * 100}%`,
                        }}
                    >★</span>
                </span>
            );
        }
        return (
            <span className={className} style={wrapperStyle} aria-label={label}>
                {stars}
            </span>
        );
    }

    // Simple filled/empty approach for whole-number ratings.
    const full = Math.round(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
        stars.push(
            <span key={i} style={{ color: i < full ? filledColor : emptyColor, fontSize }}>★</span>
        );
    }
    return (
        <span className={className} style={wrapperStyle} aria-label={label}>
            {stars}
        </span>
    );
}
