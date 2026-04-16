import './Spotlight.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { SpotlightProps } from './Spotlight.schema';

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
                wrapperClassName="spotlight__image-wrap"
                imgClassName="spotlight__image"
            />
            <div className="spotlight__body">
                {eyebrow && (
                    <p className="spotlight__eyebrow" {...eyebrowEdit}>{eyebrow}</p>
                )}
                <h2 className="spotlight__title" {...titleEdit}>{title}</h2>
                <p className="spotlight__text" {...bodyEdit}>{body}</p>
                {caption && (
                    <p className="spotlight__caption" {...captionEdit}>{caption}</p>
                )}
            </div>
        </div>
    );
}
