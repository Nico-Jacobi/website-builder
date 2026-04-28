import './CTABand.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import type { CTABandProps } from '@website-builder/shared';

export default function CTABand({
    heading,
    subheading,
    ctaLabel,
    ctaHref,
    ctaSecondaryLabel,
    ctaSecondaryHref,
    style = 'gradient',
}: CTABandProps) {
    const { t } = useTranslation();
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const ctaLabelEdit   = useEditableText('ctaLabel');
    const ctaSecEdit     = useEditableText('ctaSecondaryLabel');

    const hasSecondary = ctaSecondaryLabel && ctaSecondaryHref;

    return (
        <div className="cta_band" data-style={style}>
            <div className="cta_band__inner">
                <h2 className="cta_band__heading" {...headingEdit}>
                    {heading}
                </h2>

                {subheading !== undefined && (
                    <p
                        className="cta_band__subheading"
                        data-empty={!subheading || undefined}
                        data-placeholder={t('modules.content.ctaBand.subheadingPlaceholder')}
                        {...subheadingEdit}
                    >{subheading}</p>
                )}

                <div className="cta_band__buttons">
                    <a
                        className="cta_band__btn-primary"
                        href={ctaHref}
                        {...ctaLabelEdit}
                    >{ctaLabel}</a>

                    {hasSecondary && (
                        <a
                            className="cta_band__btn-ghost"
                            href={ctaSecondaryHref}
                            {...ctaSecEdit}
                        >{ctaSecondaryLabel}</a>
                    )}
                </div>
            </div>
        </div>
    );
}
