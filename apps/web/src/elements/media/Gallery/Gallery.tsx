import './Gallery.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { GalleryDefaults } from '@website-builder/shared';
import type { GalleryProps, GalleryImage } from '@website-builder/shared';

export default function Gallery({ heading, subheading, images, columns, gap, masonry }: GalleryProps) {
    const { t } = useTranslation();
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem, removeItem } = useEditModeActions();
    const blockIndex = useBlockIndex();

    return (
        <section className="section gallery">
            <div className="gallery__header" data-empty={(!heading && !subheading) || undefined}>
                <h2 className="gallery__heading" data-empty={!heading || undefined} data-placeholder={t('modules.media.gallery.headingPlaceholder')} {...headingEdit}>{heading}</h2>
                <p className="gallery__subheading" data-empty={!subheading || undefined} data-placeholder={t('modules.media.gallery.subheadingPlaceholder')} {...subheadingEdit}>{subheading}</p>
            </div>
            <div
                className="gallery__grid"
                data-columns={columns}
                data-gap={gap}
                data-masonry={masonry || undefined}
            >
                {images.map((image, index) => (
                    <GalleryItem
                        key={index}
                        image={image}
                        index={index}
                        onRemove={() => removeItem(blockIndex, 'images', index)}
                    />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'images', GalleryDefaults.images[0])}
                    title={t('modules.media.gallery.addImageLabel')}
                >+</button>
            </div>
        </section>
    );
}

function GalleryItem({
    image,
    index,
    onRemove,
}: {
    image: GalleryImage;
    index: number;
    onRemove: () => void;
}) {
    const { t } = useTranslation();
    const captionEdit = useEditableText(`images[${index}].caption`);

    return (
        <figure className="gallery__item">
            <button
                className="edit__remove-item"
                data-edit-only=""
                onClick={onRemove}
                title={t('modules.media.gallery.removeImageLabel')}
                aria-label={t('modules.media.gallery.removeImageLabel')}
            >×</button>
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
                data-placeholder={t('modules.media.gallery.captionPlaceholder')}
                {...captionEdit}
            >{image.caption}</figcaption>
        </figure>
    );
}
