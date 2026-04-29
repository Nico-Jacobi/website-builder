import './HeroPerspective.css';
import type { HeroPerspectiveProps } from '@website-builder/shared';

export default function HeroPerspective({
    headline,
    subheadline,
    pill,
    imageSrc,
    imageAlt,
    perspective,
    glow,
    primaryCta,
    secondaryCta,
    width,
}: HeroPerspectiveProps) {
    const sectionClasses = [
        'section',
        'hero_perspective',
        width === 'wide' ? 'section--wide' : width === 'ultrawide' ? 'section--ultrawide' : '',
        glow === 'primary' ? 'section--glow-primary' : glow === 'secondary' ? 'section--glow-secondary' : '',
    ].filter(Boolean).join(' ');

    const imageClass = perspective !== 'none' ? `perspective-${perspective}` : '';

    return (
        <div className={sectionClasses}>
            <div className="hero_perspective__inner">
                <div className="hero_perspective__copy">
                    {pill && <span className="hero_perspective__pill">{pill}</span>}
                    <h1 className="hero_perspective__headline">{headline}</h1>
                    {subheadline && <p className="hero_perspective__subheadline">{subheadline}</p>}
                    {(primaryCta || secondaryCta) && (
                        <div className="hero_perspective__ctas">
                            {primaryCta && (
                                <a className="hero_perspective__cta hero_perspective__cta--primary" href={primaryCta.href}>
                                    {primaryCta.label}
                                </a>
                            )}
                            {secondaryCta && (
                                <a className="hero_perspective__cta hero_perspective__cta--secondary" href={secondaryCta.href}>
                                    {secondaryCta.label}
                                </a>
                            )}
                        </div>
                    )}
                </div>
                {imageSrc && (
                    <div className="hero_perspective__media">
                        <img src={imageSrc} alt={imageAlt ?? ''} className={imageClass} />
                    </div>
                )}
            </div>
        </div>
    );
}
