import './Header.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
import type { HeaderProps } from './Header.schema';

export default function Header({ title, subtitle, icon, links }: HeaderProps) {
    const titleEdit = useEditableText('title');
    const subtitleEdit = useEditableText('subtitle');

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
                    {subtitle && <p className="header__subtitle" {...subtitleEdit}>{subtitle}</p>}
                </div>
            </div>

            {links && links.length > 0 && (
                <nav className="header__nav">
                    {links.map((link, i) => (
                        <EditableLink
                            key={i}
                            href={link.href}
                            label={link.label}
                            labelPath={`links[${i}].label`}
                        />
                    ))}
                </nav>
            )}
        </header>
    );
}
