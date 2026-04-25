import './Spotlight.css';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeState } from '../../../builder/editModeStore';
import { EditableImage } from '../../shared/EditableImage';
import type { SpotlightProps } from '@website-builder/shared';

export default function Spotlight({
    image,
    imageAlt,
    badge,
    overline,
    title,
    body,
    caption,
    imagePosition,
}: SpotlightProps) {
    const { isEditMode } = useEditModeState();
    const badgeEdit    = useEditableText('badge');
    const overlineEdit = useEditableText('overline');
    const titleEdit    = useEditableText('title');
    const bodyEdit     = useEditableText('body');
    const captionEdit  = useEditableText('caption');

    const showBadge = isEditMode || !!badge;

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
                {showBadge && (
                    <span
                        className="spotlight__badge"
                        data-empty={!badge || undefined}
                        data-placeholder="Badge"
                        {...badgeEdit}
                    >{badge}</span>
                )}
                <p
                    className="spotlight__overline"
                    data-empty={!overline || undefined}
                    data-placeholder="Kurztitel"
                    {...overlineEdit}
                >{overline}</p>
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
