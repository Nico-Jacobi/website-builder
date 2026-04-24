import './HeroBanner.css';
import type { CSSProperties } from 'react';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditableImage } from '../../../builder/useEditableImage';
import type { HeroBannerProps } from '@website-builder/shared';

export default function HeroBanner({
    heading,
    subheading,
    background,
    backgroundImage,
    minHeight,
}: HeroBannerProps) {
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { overlayElement, dragProps } = useEditableImage(backgroundImage ?? '', 'backgroundImage');

    const defaultMinHeight = minHeight ?? 480;
    // With image: overlay on top so text stays legible (background prop tints).
    // Without image: plain color if given, else the CSS var(--primary) default.
    let rootStyle: CSSProperties | undefined;
    if (backgroundImage) {
        const overlay = background ?? 'rgba(0,0,0,0.45)';
        rootStyle = {
            background: `linear-gradient(${overlay}, ${overlay}), url('${backgroundImage}') center / cover no-repeat`,
            minHeight: `${defaultMinHeight}px`,
        };
    } else if (background !== undefined) {
        rootStyle = {
            background,
            minHeight: `${defaultMinHeight}px`,
        };
    } else {
        rootStyle = {
            minHeight: `${defaultMinHeight}px`,
        };
    }

    return (
        <section
            className="hero_banner"
            data-has-image={backgroundImage ? 'true' : undefined}
            style={rootStyle}
            {...dragProps}
        >
            {overlayElement}

            <div className="hero_banner__inner">
                <h1 className="hero_banner__heading" {...headingEdit}>{heading}</h1>

                <p
                    className="hero_banner__subheading"
                    data-empty={!subheading || undefined}
                    data-placeholder="Unterüberschrift"
                    {...subheadingEdit}
                >{subheading}</p>
            </div>
        </section>
    );
}
