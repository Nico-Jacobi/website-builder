import './CardRow.css';
import { Card } from '../../shared/Card';
import type { CardRowProps } from './CardRow.schema';

export default function CardRow({ cards }: CardRowProps) {
    return (
        <div className="section card_row">
            <div className="card_row__scroll">
                {cards.map((card, index) => (
                    <Card key={index} card={card} propPathPrefix={`cards[${index}]`} />
                ))}
            </div>
        </div>
    );
}
