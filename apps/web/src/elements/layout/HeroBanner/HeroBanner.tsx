import './HeroBanner.css';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditableImage } from '../../../builder/useEditableImage';
import { useEditModeState } from '../../../builder/editModeStore';
import type { HeroBannerProps } from '@website-builder/shared';

export default function HeroBanner({
    heading,
    subheading,
    background,
    backgroundImage,
    minHeight,
    gridOverlay,
    ctaLabel,
    ctaHref,
    ctaSecondaryLabel,
    ctaSecondaryHref,
}: HeroBannerProps) {
    const { t } = useTranslation();
    const { isEditMode }    = useEditModeState();
    const headingEdit       = useEditableText('heading');
    const subheadingEdit    = useEditableText('subheading');
    const ctaLabelEdit      = useEditableText('ctaLabel');
    const ctaSecLabelEdit   = useEditableText('ctaSecondaryLabel');
    const { overlayElement, dragProps } = useEditableImage(backgroundImage ?? '', 'backgroundImage');

    const showPrimaryCta   = isEditMode || !!ctaLabel;
    const showSecondaryCta = isEditMode || !!ctaSecondaryLabel;

    const defaultMinHeight = minHeight ?? 480;

    // rootStyle logic:
    // - With image: gradient overlay + cover image (unchanged)
    // - With explicit background prop: color as inline (unchanged)
    // - Without either: only minHeight → CSS default var(--gradient_hero) applies
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
        rootStyle = { minHeight: `${defaultMinHeight}px` };
        // No inline background → CSS class .hero_banner default var(--gradient_hero) applies
    }

    return (
        <section
            className="hero_banner"
            data-has-image={backgroundImage ? 'true' : undefined}
            data-grid-overlay={gridOverlay ? 'true' : undefined}
            style={rootStyle}
            {...dragProps}
        >
            {overlayElement}

            <div className="hero_banner__inner">
                <h1 className="hero_banner__heading" {...headingEdit}>{heading}</h1>

                <p
                    className="hero_banner__subheading"
                    data-empty={!subheading || undefined}
                    data-placeholder={t('modules.layout.heroBanner.subheadingPlaceholder')}
                    {...subheadingEdit}
                >{subheading}</p>

                {(showPrimaryCta || showSecondaryCta) && (
                    <div className="hero_banner__ctas">
                        {showPrimaryCta && (
                            <a
                                className="hero_banner__cta-primary"
                                href={ctaHref || '#'}
                                data-empty={!ctaLabel || undefined}
                                data-placeholder={t('modules.layout.heroBanner.primaryCtaPlaceholder')}
                                {...ctaLabelEdit}
                            >{ctaLabel}</a>
                        )}
                        {showSecondaryCta && (
                            <a
                                className="hero_banner__cta-secondary"
                                href={ctaSecondaryHref || '#'}
                                data-empty={!ctaSecondaryLabel || undefined}
                                data-placeholder={t('modules.layout.heroBanner.secondaryCtaPlaceholder')}
                                {...ctaSecLabelEdit}
                            >{ctaSecondaryLabel}</a>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
