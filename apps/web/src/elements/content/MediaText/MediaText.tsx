import './MediaText.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { MediaTextProps } from './MediaText.schema';

export default function MediaText({ imageSrc, imageAlt, heading, body, imagePosition }: MediaTextProps) {
    const headingEdit = useEditableText('heading');
    const bodyEdit = useEditableText('body');

    return (
        <div className="section media_text" data-image-position={imagePosition}>
            <EditableImage
                path="imageSrc"
                src={imageSrc}
                alt={imageAlt}
                wrapperClassName="media_text__img-wrap"
                imgClassName="media_text__image"
            />
            <div className="media_text__content">
                {heading && <h2 className="media_text__heading" {...headingEdit}>{heading}</h2>}
                <p className="media_text__body" {...bodyEdit}>{body}</p>
            </div>
        </div>
    );
}
