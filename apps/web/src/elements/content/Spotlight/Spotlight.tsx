import './Spotlight.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { SpotlightProps } from '@website-builder/shared';

export default function Spotlight({
    image,
    imageAlt,
    eyebrow,
    title,
    body,
    caption,
    imagePosition,
}: SpotlightProps) {
    const eyebrowEdit = useEditableText('eyebrow');
    const titleEdit   = useEditableText('title');
    const bodyEdit    = useEditableText('body');
    const captionEdit = useEditableText('caption');

    return (
        <div className="section spotlight" data-image-position={imagePosition}>
            <EditableImage
                path="image"
                src={image}
                alt={imageAlt ?? title}
                altPath="imageAlt"
                wrapperClassName="spotlight__image-wrap"
                imgClassName="spotlight__image"
            />
            <div className="spotlight__body">
                <p
                    className="spotlight__eyebrow"
                    data-empty={!eyebrow || undefined}
                    data-placeholder="Eyebrow"
                    {...eyebrowEdit}
                >{eyebrow}</p>
                <h2 className="spotlight__title" {...titleEdit}>{title}</h2>
                <p className="spotlight__text" {...bodyEdit}>{body}</p>
                <p
                    className="spotlight__caption"
                    data-empty={!caption || undefined}
                    data-placeholder="Bildunterschrift"
                    {...captionEdit}
                >{caption}</p>
            </div>
        </div>
    );
}
