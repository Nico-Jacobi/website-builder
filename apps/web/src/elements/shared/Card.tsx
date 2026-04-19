import { useEditableText } from '../../builder/useEditableText';
import { EditableImage } from './EditableImage';
import type { CardData } from './schemas';

interface CardProps {
    card: CardData;
    propPathPrefix?: string;
}

export function Card({ card, propPathPrefix = 'cards[0]' }: CardProps) {
    const titleEdit = useEditableText(`${propPathPrefix}.title`);
    const bodyEdit = useEditableText(`${propPathPrefix}.body`);

    return (
        <article className="card">
            <EditableImage
                path={`${propPathPrefix}.imageSrc`}
                src={card.imageSrc}
                alt={card.imageAlt ?? ''}
                altPath={`${propPathPrefix}.imageAlt`}
                wrapperClassName="card__img-wrap"
                imgClassName="card__img"
            />
            <h3 className="card__title" {...titleEdit}>{card.title}</h3>
            {card.body && <p className="card__body" {...bodyEdit}>{card.body}</p>}
        </article>
    );
}
