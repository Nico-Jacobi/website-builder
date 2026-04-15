import './Gallery.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { GalleryProps, GalleryImage } from './Gallery.schema';

export default function Gallery({ images, columns, gap }: GalleryProps) {
    return (
        <section className="section gallery">
            <div
                className="gallery__grid"
                data-columns={columns}
                data-gap={gap}
            >
                {images.map((image, index) => (
                    <GalleryItem key={index} image={image} index={index} />
                ))}
            </div>
        </section>
    );
}

function GalleryItem({
    image,
    index,
}: {
    image: GalleryImage;
    index: number;
}) {
    const captionEdit = useEditableText(`images[${index}].caption`);
    return (
        <figure className="gallery__item">
            <EditableImage
                path={`images[${index}].src`}
                src={image.src}
                alt={image.alt}
                wrapperClassName="gallery__img-wrap"
                imgClassName="gallery__img"
            />
            {image.caption && (
                <figcaption className="gallery__caption" {...captionEdit}>
                    {image.caption}
                </figcaption>
            )}
        </figure>
    );
}
