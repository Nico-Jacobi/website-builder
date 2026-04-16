import './ImageBlock.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { ImageBlockProps } from './ImageBlock.schema';

export default function ImageBlock({ src, alt, caption, objectFit, maxHeight }: ImageBlockProps) {
    const captionEdit = useEditableText('caption');

    return (
        <figure className="image_block">
            <EditableImage
                path="src"
                src={src}
                alt={alt}
                wrapperClassName="image_block__img-wrap"
                imgClassName="image_block__img"
                imgStyle={{ objectFit, maxHeight }}
            />
            {caption && (
                <figcaption className="image_block__caption" {...captionEdit}>{caption}</figcaption>
            )}
        </figure>
    );
}
