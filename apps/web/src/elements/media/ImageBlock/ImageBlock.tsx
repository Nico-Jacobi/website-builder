import './ImageBlock.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { ImageBlockProps } from '@website-builder/shared';

export default function ImageBlock({ src, alt, caption, objectFit, maxHeight, aspectRatio }: ImageBlockProps) {
    const captionEdit = useEditableText('caption');

    return (
        <figure className="image_block">
            <EditableImage
                path="src"
                src={src}
                alt={alt}
                altPath="alt"
                wrapperClassName="image_block__img-wrap"
                imgClassName="image_block__img"
                imgStyle={{ objectFit, maxHeight }}
                imgProps={aspectRatio ? { 'data-aspect-ratio': aspectRatio } as Record<string, string> : undefined}
            />
            <figcaption
                className="image_block__caption"
                data-empty={!caption || undefined}
                data-placeholder="Bildunterschrift"
                {...captionEdit}
            >{caption}</figcaption>
        </figure>
    );
}
