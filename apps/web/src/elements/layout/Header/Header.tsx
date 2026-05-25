import './Header.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeState } from '../../../builder/editModeStore';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
import type { HeaderProps } from '@website-builder/shared';

export default function Header({ title, subtitle, icon, links, ctaLabel, ctaHref, variant = 'solid' }: HeaderProps) {
    const { t } = useTranslation();
    const { isEditMode } = useEditModeState();
    const [menuOpen, setMenuOpen] = useState(false);
    const titleEdit    = useEditableText('title');
    const subtitleEdit = useEditableText('subtitle');
    const ctaLabelEdit = useEditableText('ctaLabel');

    const hasLinks = links && links.length > 0;
    const showCta  = isEditMode || !!ctaLabel;
    const showNav  = hasLinks || showCta;

    return (
        <header className={`header header--${variant}`}>
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
                            data-placeholder={t('modules.layout.header.subtitlePlaceholder')}
                            {...subtitleEdit}
                        >{subtitle}</p>
                    )}
                </div>
            </div>

            {showNav && (
                <>
                    <button
                        type="button"
                        className="header__menu-toggle"
                        aria-label={t('modules.layout.header.menuToggle', { defaultValue: 'Menu' })}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span className="header__menu-bar" />
                        <span className="header__menu-bar" />
                        <span className="header__menu-bar" />
                    </button>
                    <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`}>
                        {links?.map((link, i) => (
                            <EditableLink
                                key={i}
                                href={link.href}
                                label={link.label}
                                labelPath={`links[${i}].label`}
                                hrefPath={`links[${i}].href`}
                            />
                        ))}
                        {showCta && (
                            <a
                                className="header__cta"
                                href={ctaHref || '#'}
                                data-empty={!ctaLabel || undefined}
                                data-placeholder={t('modules.layout.header.ctaPlaceholder')}
                                {...ctaLabelEdit}
                            >{ctaLabel}</a>
                        )}
                    </nav>
                </>
            )}
        </header>
    );
}
