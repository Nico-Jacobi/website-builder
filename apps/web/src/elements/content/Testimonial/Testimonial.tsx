import './Testimonial.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { TestimonialDefaults } from '@website-builder/shared';
import type { TestimonialProps, TestimonialItem } from '@website-builder/shared';

export default function Testimonial({ heading, items }: TestimonialProps) {
    const { t } = useTranslation();
    const headingEdit = useEditableText('heading');
    const { addItem } = useEditModeActions();
    const blockIndex  = useBlockIndex();

    return (
        <div className="section testimonial">
            {heading && (
                <h2 className="testimonial__heading" {...headingEdit}>{heading}</h2>
            )}
            <div className="testimonial__grid">
                {items.map((item, index) => (
                    <TestimonialCard
                        key={index}
                        item={item}
                        propPathPrefix={`items[${index}]`}
                    />
                ))}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'items', TestimonialDefaults.items[0])}
                    title={t('modules.content.testimonial.addItemLabel')}
                >+</button>
            </div>
        </div>
    );
}

interface TestimonialCardProps {
    item: TestimonialItem;
    propPathPrefix: string;
}

function TestimonialCard({ item, propPathPrefix }: TestimonialCardProps) {
    const quoteEdit  = useEditableText(`${propPathPrefix}.quote`);
    const authorEdit = useEditableText(`${propPathPrefix}.author`);
    const roleEdit   = useEditableText(`${propPathPrefix}.role`);

    const roleLabel = [item.role, item.company].filter(Boolean).join(', ');

    return (
        <article className="testimonial__card">
            <span className="testimonial__quote-mark" aria-hidden="true">&ldquo;</span>
            <p className="testimonial__quote" {...quoteEdit}>{item.quote}</p>
            <div className="testimonial__author-row">
                <EditableImage
                    path={`${propPathPrefix}.avatarSrc`}
                    src={item.avatarSrc}
                    alt={item.author}
                    altPath={`${propPathPrefix}.author`}
                    wrapperClassName="testimonial__avatar-wrap"
                    imgClassName="testimonial__avatar"
                />
                <div className="testimonial__author-meta">
                    <p className="testimonial__author" {...authorEdit}>{item.author}</p>
                    {roleLabel && (
                        <p className="testimonial__role" {...roleEdit}>{roleLabel}</p>
                    )}
                </div>
            </div>
        </article>
    );
}
