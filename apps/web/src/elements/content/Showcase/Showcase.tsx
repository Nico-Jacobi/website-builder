import './Showcase.css';
import type { ShowcaseProps } from '@website-builder/shared';

export default function Showcase({
    heading,
    body,
    imageSrc,
    imageAlt,
    imagePosition,
    perspective,
    glow,
    width,
    cta,
}: ShowcaseProps) {
    const sectionClasses = [
        'section',
        'showcase',
        width === 'wide' ? 'section--wide' : width === 'ultrawide' ? 'section--ultrawide' : '',
        glow === 'primary' ? 'section--glow-primary' : glow === 'secondary' ? 'section--glow-secondary' : '',
        imagePosition === 'left' ? 'showcase--media-left' : 'showcase--media-right',
    ].filter(Boolean).join(' ');

    const imageClass = perspective !== 'none' ? `perspective-${perspective}` : '';

    return (
        <div className={sectionClasses}>
            <div className="showcase__inner">
                <div className="showcase__copy">
                    <h2 className="showcase__heading">{heading}</h2>
                    {body && <p className="showcase__body">{body}</p>}
                    {cta && (
                        <a className="showcase__cta" href={cta.href}>{cta.label}</a>
                    )}
                </div>
                {imageSrc && (
                    <div className="showcase__media">
                        <img src={imageSrc} alt={imageAlt ?? ''} className={imageClass} />
                    </div>
                )}
            </div>
        </div>
    );
}
