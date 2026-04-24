import './FooterSimple.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableLink } from '../../shared/EditableLink';
import type { FooterSimpleProps } from '@website-builder/shared';

export default function FooterSimple({ tagline, copyright, links }: FooterSimpleProps) {
    const taglineEdit = useEditableText('tagline');
    const copyrightEdit = useEditableText('copyright');
    const hasLinks = links && links.length > 0;

    return (
        <footer className="footer_simple">
            <div className="footer_simple__left">
                {tagline && <span className="footer_simple__tagline" {...taglineEdit}>{tagline}</span>}
                {copyright && <span className="footer_simple__copyright" {...copyrightEdit}>{copyright}</span>}
            </div>

            {hasLinks && (
                <nav className="footer_simple__links">
                    {links!.map((link, i) => (
                        <EditableLink
                            key={i}
                            className="footer_simple__link"
                            href={link.href}
                            label={link.label}
                            labelPath={`links[${i}].label`}
                        />
                    ))}
                </nav>
            )}
        </footer>
    );
}
