import './CardGrid.css';
import { Card } from '../../shared/Card';
import type { CardGridProps } from './CardGrid.schema';

export default function CardGrid({ cards, columns }: CardGridProps) {
    return (
        <div className="section card_grid" data-columns={columns}>
            <div className="card_grid__grid">
                {cards.map((card, index) => (
                    <Card key={index} card={card} propPathPrefix={`cards[${index}]`} />
                ))}
            </div>
        </div>
    );
}
