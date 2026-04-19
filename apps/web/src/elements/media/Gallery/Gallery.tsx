import './Gallery.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { GalleryDefaults } from './Gallery.schema';
import type { GalleryProps, GalleryImage } from './Gallery.schema';

export default function Gallery({ heading, subheading, images, columns, gap }: GalleryProps) {
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem } = useEditModeActions();
    const blockIndex = useBlockIndex();

    return (
        <section className="section gallery">
            <div className="gallery__header" data-empty={(!heading && !subheading) || undefined}>
                <h2 className="gallery__heading" data-empty={!heading || undefined} data-placeholder="Überschrift" {...headingEdit}>{heading}</h2>
                <p className="gallery__subheading" data-empty={!subheading || undefined} data-placeholder="Untertext" {...subheadingEdit}>{subheading}</p>
            </div>
            <div
                className="gallery__grid"
                data-columns={columns}
                data-gap={gap}
            >
                {images.map((image, index) => (
                    <GalleryItem key={index} image={image} index={index} />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'images', GalleryDefaults.images[0])}
                    title="Bild hinzufügen"
                >+</button>
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
                altPath={`images[${index}].alt`}
                wrapperClassName="gallery__img-wrap"
                imgClassName="gallery__img"
            />
            <figcaption
                className="gallery__caption"
                data-empty={!image.caption || undefined}
                data-placeholder="Bildunterschrift"
                {...captionEdit}
            >{image.caption}</figcaption>
        </figure>
    );
}
