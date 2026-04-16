import type { CSSProperties } from 'react';
import { useEditableImage } from '../../builder/useEditableImage';

/**
 * Shared wrapper for an image that can be swapped in edit mode.
 *
 * Encapsulates the invariant that every editable image needs:
 *   1. a `position: relative` wrapper (so the overlay can absolute-position),
 *   2. the overlay rendered AFTER the img (so it stacks on top),
 *   3. the useEditableImage hook bound to the right prop path.
 *
 * Each module keeps styling control via wrapperClassName/imgClassName; the
 * parent CSS class should declare `position: relative` as before.
 *
 * Usage:
 *   <EditableImage
 *       path="icon"
 *       src={icon}
 *       wrapperClassName="header__icon-wrap"
 *       imgClassName="header__icon"
 *   />
 */
export interface EditableImageProps {
    /** Prop path passed to useEditableImage (e.g. "imageSrc", "cards[0].imageSrc"). */
    path: string;
    src: string | undefined;
    alt?: string;
    wrapperClassName?: string;
    imgClassName?: string;
    imgStyle?: CSSProperties;
}

export function EditableImage({
    path,
    src,
    alt = '',
    wrapperClassName,
    imgClassName,
    imgStyle,
}: EditableImageProps) {
    const { overlayElement } = useEditableImage(src ?? '', path);
    return (
        <div className={wrapperClassName}>
            {src && <img className={imgClassName} src={src} alt={alt} style={imgStyle} />}
            {overlayElement}
        </div>
    );
}
