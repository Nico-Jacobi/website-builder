import './CardGrid.css';
import { Card } from '../../shared/Card';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { CardGridDefaults } from './CardGrid.schema';
import type { CardGridProps } from './CardGrid.schema';

export default function CardGrid({ cards, columns }: CardGridProps) {
    const { addItem } = useEditModeActions();
    const blockIndex = useBlockIndex();

    return (
        <div className="section card_grid" data-columns={columns}>
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
