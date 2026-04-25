import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { useEditableImage } from '../../builder/useEditableImage';

/**
 * Shared wrapper for an image that can be swapped in edit mode.
 *
 * Encapsulates the invariant that every editable image needs:
 *   1. a `position: relative` wrapper (so the overlay can absolute-position),
 *   2. the overlay rendered AFTER the img (so it stacks on top),
 *   3. the useEditableImage hook bound to the right prop path.
 *   4. drag-and-drop support (dragProps spread on the wrapper),
 *   5. a placeholder when no src is set (edit mode only).
 *
 * When `altPath` is supplied, the alt-text field appears in the edit modal.
 */
export interface EditableImageProps {
    /** Prop path passed to useEditableImage (e.g. "imageSrc", "cards[0].imageSrc"). */
    path: string;
    src: string | undefined;
    alt?: string;
    /** Prop path of the alt-text field. Enables alt-text input in the edit modal. */
    altPath?: string;
    wrapperClassName?: string;
    imgClassName?: string;
    imgStyle?: CSSProperties;
    /** Additional props to spread on the underlying <img> element (e.g. data-* attributes). */
    imgProps?: ImgHTMLAttributes<HTMLImageElement> | Record<string, string | undefined>;
}

export function EditableImage({
    path,
    src,
    alt = '',
    altPath,
    wrapperClassName,
    imgClassName,
    imgStyle,
    imgProps,
}: EditableImageProps) {
    const { overlayElement, dragProps, openModal } = useEditableImage(src ?? '', path, altPath, alt);

    return (
        <div className={wrapperClassName} {...dragProps}>
            {src
                ? <img className={imgClassName} src={src} alt={alt} style={imgStyle} {...imgProps} />
                : <div
                    className="edit__img-placeholder"
                    data-edit-only=""
                    onClick={openModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openModal?.()}
                  >Bild hinzufügen</div>
            }
            {overlayElement}
        </div>
    );
}
