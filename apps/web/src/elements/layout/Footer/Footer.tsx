import './Footer.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableLink } from '../../shared/EditableLink';
import type { FooterProps, FooterColumn } from '@website-builder/shared';

export default function Footer({ tagline, copyright, columns, compact }: FooterProps) {
    const taglineEdit   = useEditableText('tagline');
    const copyrightEdit = useEditableText('copyright');

    /* ── Compact-Layout (Single-Row, ex FooterSimple) ── */
    if (compact) {
        // Im Compact-Modus: alle Links aus allen Spalten flach in eine Nav-Zeile
        const flatLinks: { colIndex: number; linkIndex: number; label: string; href: string }[] =
            columns?.flatMap((col, colIndex) =>
                col.links.map((link, linkIndex) => ({
                    colIndex,
                    linkIndex,
                    label: link.label,
                    href: link.href,
                }))
            ) ?? [];
        const hasLinks = flatLinks.length > 0;

        return (
            <footer className="footer footer--compact">
                <div className="footer__compact-inner">
                    <div className="footer__compact-left">
                        {tagline && (
                            <span className="footer__tagline" {...taglineEdit}>{tagline}</span>
                        )}
                        {copyright && (
                            <span className="footer__copyright" {...copyrightEdit}>{copyright}</span>
                        )}
                    </div>

                    {hasLinks && (
                        <nav className="footer__compact-links">
                            {flatLinks.map((link, i) => (
                                <EditableLink
                                    key={i}
                                    className="footer__link"
                                    href={link.href}
                                    label={link.label}
                                    labelPath={`columns[${link.colIndex}].links[${link.linkIndex}].label`}
                                />
                            ))}
                        </nav>
                    )}
                </div>
            </footer>
        );
    }

    /* ── Standard-Layout (Full-Column) ── */
    const hasColumns = columns && columns.length > 0;

    return (
        <footer className="footer">
            <div className="footer__inner">
                {hasColumns && (
                    <div className="footer__columns">
                        {columns!.map((col, i) => (
                            <FooterColumnItem key={i} col={col} colIndex={i} />
                        ))}
                    </div>
                )}

                <div className="footer__bottom">
                    {tagline && <p className="footer__tagline" {...taglineEdit}>{tagline}</p>}
                    {copyright && <p className="footer__copyright" {...copyrightEdit}>{copyright}</p>}
                </div>
            </div>
        </footer>
    );
}

function FooterColumnItem({
    col,
    colIndex,
}: {
    col: FooterColumn;
    colIndex: number;
}) {
    const headingEdit = useEditableText(`columns[${colIndex}].heading`);
    return (
        <div className="footer__column">
            {col.heading && (
                <h3 className="footer__column-heading" {...headingEdit}>
                    {col.heading}
                </h3>
            )}
            <ul className="footer__links">
                {col.links.map((link, i) => (
                    <li key={i}>
                        <EditableLink
                            className="footer__link"
                            href={link.href}
                            label={link.label}
                            labelPath={`columns[${colIndex}].links[${i}].label`}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
