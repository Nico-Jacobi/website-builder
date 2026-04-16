import './HeroBanner.css';
import type { CSSProperties } from 'react';
import { useEditableText } from '../../../builder/useEditableText';
import type { HeroBannerProps } from './HeroBanner.schema';

export default function HeroBanner({
    heading,
    subheading,
    ctaLabel,
    ctaHref,
    background,
    backgroundImage,
}: HeroBannerProps) {
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const ctaLabelEdit = useEditableText('ctaLabel');

    // Build inline background style.
    // - Image only: dark overlay so text stays legible.
    // - Image + color: use color as the overlay tint.
    // - Color only: set as flat background.
    // - Neither: CSS var(--primary) takes effect naturally.
    let rootStyle: CSSProperties | undefined;
    if (backgroundImage) {
        const overlay = background ?? 'rgba(0,0,0,0.45)';
        rootStyle = {
            background: `linear-gradient(${overlay}, ${overlay}), url('${backgroundImage}') center / cover no-repeat`,
        };
    } else if (background !== undefined) {
        rootStyle = { background };
    }

    return (
        <section
            className="hero_banner"
            data-has-image={backgroundImage ? 'true' : undefined}
            style={rootStyle}
        >
            <div className="hero_banner__inner">
                <h1 className="hero_banner__heading" {...headingEdit}>{heading}</h1>

                {subheading && (
                    <p className="hero_banner__subheading" {...subheadingEdit}>{subheading}</p>
                )}

                {ctaLabel && (
                    <a className="hero_banner__cta" href={ctaHref ?? '#'} {...ctaLabelEdit}>
                        {ctaLabel}
                    </a>
                )}
            </div>
        </section>
    );
}
