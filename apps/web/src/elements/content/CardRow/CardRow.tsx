import './CardRow.css';
import { useTranslation } from 'react-i18next';
import { Card } from '../../shared/Card';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { CardRowDefaults } from '@website-builder/shared';
import type { CardRowProps } from '@website-builder/shared';

export default function CardRow({ heading, subheading, cards }: CardRowProps) {
    const { t } = useTranslation();
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section card_row">
            {heading && (
                <header>
                    <h2 className="card_row__heading" {...headingEdit}>{heading}</h2>
                    {subheading && (
                        <p className="card_row__subheading" {...subheadingEdit}>{subheading}</p>
                    )}
                </header>
            )}
            <div className="card_row__scroll">
                {cards.map((card, index) => (
                    <Card key={index} card={card} propPathPrefix={`cards[${index}]`} />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'cards', CardRowDefaults.cards[0])}
                    title={t('modules.content.cardRow.addCardLabel')}
                >+</button>
            </div>
        </div>
    );
}
