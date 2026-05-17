import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../builder/useEditableText';
import { useEditModeState } from '../../builder/editModeStore';
import { EditableImage } from './EditableImage';
import type { CardData } from '@website-builder/shared';

interface CardProps {
    card: CardData;
    propPathPrefix: string;
}

export function Card({ card, propPathPrefix }: CardProps) {
    const { t } = useTranslation();
    const { isEditMode } = useEditModeState();
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
            {(isEditMode || card.body) && (
                <p
                    className="card__body"
                    data-empty={!card.body || undefined}
                    data-placeholder={t('modules.shared.card.bodyPlaceholder')}
                    {...bodyEdit}
                >{card.body}</p>
            )}
        </article>
    );
}
