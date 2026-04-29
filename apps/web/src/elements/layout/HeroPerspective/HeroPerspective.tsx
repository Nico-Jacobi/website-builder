import './HeroPerspective.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
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
    const headlineEdit    = useEditableText('headline');
    const subheadlineEdit = useEditableText('subheadline');
    const pillEdit        = useEditableText('pill');

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
                    {pill && <span className="hero_perspective__pill" {...pillEdit}>{pill}</span>}
                    <h1 className="hero_perspective__headline" {...headlineEdit}>{headline}</h1>
                    {subheadline && <p className="hero_perspective__subheadline" {...subheadlineEdit}>{subheadline}</p>}
                    {(primaryCta || secondaryCta) && (
                        <div className="hero_perspective__ctas">
                            {primaryCta && (
                                <EditableLink
                                    className="hero_perspective__cta hero_perspective__cta--primary"
                                    href={primaryCta.href}
                                    label={primaryCta.label}
                                    labelPath="primaryCta.label"
                                />
                            )}
                            {secondaryCta && (
                                <EditableLink
                                    className="hero_perspective__cta hero_perspective__cta--secondary"
                                    href={secondaryCta.href}
                                    label={secondaryCta.label}
                                    labelPath="secondaryCta.label"
                                />
                            )}
                        </div>
                    )}
                </div>
                <EditableImage
                    path="imageSrc"
                    src={imageSrc}
                    alt={imageAlt ?? ''}
                    altPath="imageAlt"
                    wrapperClassName="hero_perspective__media"
                    imgClassName={imageClass}
                />
            </div>
        </div>
    );
}
