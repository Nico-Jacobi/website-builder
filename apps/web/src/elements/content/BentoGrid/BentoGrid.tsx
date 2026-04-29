import './BentoGrid.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { BentoGridDefaults } from '@website-builder/shared';
import type { BentoGridProps, BentoCell } from '@website-builder/shared';

export default function BentoGrid({ heading, subheading, cells }: BentoGridProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section bento_grid">
            {(heading || subheading) && (
                <header className="bento_grid__header">
                    {heading && <h2 className="bento_grid__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="bento_grid__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <div className="bento_grid__grid">
                {cells.map((cell, i) => (
                    <BentoCellCard key={i} cell={cell} prefix={`cells[${i}]`} />
                ))}
            </div>
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'cells', BentoGridDefaults.cells[0])}
                title="Add cell"
            >+</button>
        </div>
    );
}

interface BentoCellCardProps { cell: BentoCell; prefix: string; }

function BentoCellCard({ cell, prefix }: BentoCellCardProps) {
    const titleEdit = useEditableText(`${prefix}.title`);
    const bodyEdit  = useEditableText(`${prefix}.body`);
    return (
        <article className={`bento_grid__cell bento_grid__cell--${cell.span}${cell.accent ? ' bento_grid__cell--accent' : ''}`}>
            <EditableImage
                path={`${prefix}.imageSrc`}
                src={cell.imageSrc}
                alt={cell.imageAlt ?? ''}
                altPath={`${prefix}.imageAlt`}
                wrapperClassName="bento_grid__media"
            />
            <div className="bento_grid__copy">
                <h3 className="bento_grid__title" {...titleEdit}>{cell.title}</h3>
                {cell.body && <p className="bento_grid__body" {...bodyEdit}>{cell.body}</p>}
            </div>
        </article>
    );
}
