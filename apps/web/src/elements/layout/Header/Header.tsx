import './Header.css';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeState } from '../../../builder/editModeStore';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
import type { HeaderProps } from '@website-builder/shared';

export default function Header({ title, subtitle, icon, links, ctaLabel, ctaHref }: HeaderProps) {
    const { isEditMode } = useEditModeState();
    const titleEdit    = useEditableText('title');
    const subtitleEdit = useEditableText('subtitle');
    const ctaLabelEdit = useEditableText('ctaLabel');

    const hasLinks = links && links.length > 0;
    const showCta  = isEditMode || !!ctaLabel;
    const showNav  = hasLinks || showCta;

    return (
        <header className="header">
            <div className="header__brand">
                <div data-empty={!icon || undefined} data-edit-only={!icon || undefined}>
                    <EditableImage
                        path="icon"
                        src={icon}
                        wrapperClassName="header__icon-wrap"
                        imgClassName="header__icon"
                    />
                </div>
                <div>
                    <h1 className="header__title" {...titleEdit}>{title}</h1>
                    {(isEditMode || subtitle) && (
                        <p
                            className="header__subtitle"
                            data-empty={!subtitle || undefined}
                            data-placeholder="Untertitel"
                            {...subtitleEdit}
                        >{subtitle}</p>
                    )}
                </div>
            </div>

            {showNav && (
                <nav className="header__nav">
                    {links?.map((link, i) => (
                        <EditableLink
                            key={i}
                            href={link.href}
                            label={link.label}
                            labelPath={`links[${i}].label`}
                        />
                    ))}
                    {showCta && (
                        <a
                            className="header__cta"
                            href={ctaHref || '#'}
                            data-empty={!ctaLabel || undefined}
                            data-placeholder="CTA"
                            {...ctaLabelEdit}
                        >{ctaLabel}</a>
                    )}
                </nav>
            )}
        </header>
    );
}
