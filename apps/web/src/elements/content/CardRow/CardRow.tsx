import './CardRow.css';
import { Card } from '../../shared/Card';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { CardRowDefaults } from './CardRow.schema';
import type { CardRowProps } from './CardRow.schema';

export default function CardRow({ cards }: CardRowProps) {
    const { addItem } = useEditModeActions();
    const blockIndex = useBlockIndex();

    return (
        <div className="section card_row">
            <div className="card_row__scroll">
                {cards.map((card, index) => (
                    <Card key={index} card={card} propPathPrefix={`cards[${index}]`} />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'cards', CardRowDefaults.cards[0])}
                    title="Karte hinzufügen"
                >+</button>
            </div>
        </div>
    );
}
