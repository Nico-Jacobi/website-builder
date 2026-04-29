import './Showcase.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
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
    const headingEdit = useEditableText('heading');
    const bodyEdit    = useEditableText('body');

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
                    <h2 className="showcase__heading" {...headingEdit}>{heading}</h2>
                    {body && <p className="showcase__body" {...bodyEdit}>{body}</p>}
                    {cta && (
                        <EditableLink
                            className="showcase__cta"
                            href={cta.href}
                            label={cta.label}
                            labelPath="cta.label"
                        />
                    )}
                </div>
                <EditableImage
                    path="imageSrc"
                    src={imageSrc}
                    alt={imageAlt ?? ''}
                    altPath="imageAlt"
                    wrapperClassName="showcase__media"
                    imgClassName={imageClass}
                />
            </div>
        </div>
    );
}
