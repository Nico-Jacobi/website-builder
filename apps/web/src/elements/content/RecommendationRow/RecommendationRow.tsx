import './RecommendationRow.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { RecommendationRowDefaults } from '@website-builder/shared';
import type { RecommendationRowProps, Recommendation } from '@website-builder/shared';

export default function RecommendationRow({ heading, items }: RecommendationRowProps) {
    const headingEdit = useEditableText('heading');
    const { addItem } = useEditModeActions();
    const blockIndex = useBlockIndex();

    return (
        <div className="section recommendation_row">
            {heading && (
                <h2 className="recommendation_row__heading" {...headingEdit}>
                    {heading}
                </h2>
            )}
            <div className="recommendation_row__scroll">
                {items.map((item, index) => (
                    <RecommendationCard
                        key={index}
                        item={item}
                        propPathPrefix={`items[${index}]`}
                    />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'items', RecommendationRowDefaults.items[0])}
                    title="Empfehlung hinzufügen"
                >+</button>
            </div>
        </div>
    );
}

interface RecommendationCardProps {
    item: Recommendation;
    propPathPrefix: string;
}

function RecommendationCard({ item, propPathPrefix }: RecommendationCardProps) {
    const nameEdit   = useEditableText(`${propPathPrefix}.name`);
    const sourceEdit = useEditableText(`${propPathPrefix}.source`);
    const quoteEdit  = useEditableText(`${propPathPrefix}.quote`);

    const rating = Math.max(0, Math.min(5, item.rating));
    const fillPct = (rating / 5) * 100;

    return (
        <article className="recommendation">
            <header className="recommendation__header">
                <EditableImage
                    path={`${propPathPrefix}.image`}
                    src={item.image}
                    alt={item.imageAlt ?? item.name}
                    altPath={`${propPathPrefix}.imageAlt`}
                    wrapperClassName={`recommendation__image-wrap${!item.image ? ' recommendation__image-wrap--empty' : ''}`}
                    imgClassName="recommendation__image"
                />
                <div className="recommendation__meta">
                    <p className="recommendation__name" {...nameEdit}>{item.name}</p>
                    {item.source && (
                        <p className="recommendation__source" {...sourceEdit}>{item.source}</p>
                    )}
                </div>
            </header>

            <div
                className="recommendation__stars"
                role="img"
                aria-label={`${rating} von 5 Sternen`}
            >
                <span className="recommendation__stars-bg" aria-hidden="true">★★★★★</span>
                <span
                    className="recommendation__stars-fg"
                    aria-hidden="true"
                    style={{ width: `${fillPct}%` }}
                >★★★★★</span>
            </div>

            <p className="recommendation__quote" {...quoteEdit}>
                &ldquo;{item.quote}&rdquo;
            </p>
        </article>
    );
}
