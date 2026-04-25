import './CardGrid.css';
import { Card } from '../../shared/Card';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { CardGridDefaults } from '@website-builder/shared';
import type { CardGridProps } from '@website-builder/shared';

export default function CardGrid({ heading, subheading, cards, columns }: CardGridProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section card_grid" data-columns={columns}>
            {heading && (
                <header>
                    <h2 className="card_grid__heading" {...headingEdit}>{heading}</h2>
                    {subheading && (
                        <p className="card_grid__subheading" {...subheadingEdit}>{subheading}</p>
                    )}
                </header>
            )}
            <div className="card_grid__grid">
                {cards.map((card, index) => (
                    <Card key={index} card={card} propPathPrefix={`cards[${index}]`} />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'cards', CardGridDefaults.cards[0])}
                    title="Karte hinzufügen"
                >+</button>
            </div>
        </div>
    );
}
