import './FAQ.css';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { FAQDefaults } from '@website-builder/shared';
import type { FAQProps, FAQItem } from '@website-builder/shared';

export default function FAQ({ heading, subheading, items, layout }: FAQProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section section--narrow faq">
            <div className="faq__inner">
                {(heading || subheading) && (
                    <header className="faq__header">
                        {heading && <h2 className="faq__heading" {...headingEdit}>{heading}</h2>}
                        {subheading && <p className="faq__subheading" {...subheadingEdit}>{subheading}</p>}
                    </header>
                )}

                {layout === 'accordion' ? (
                    <div className="faq__list faq__list--accordion">
                        {items.map((item, i) => (
                            <FAQAccordionItem key={i} item={item} prefix={`items[${i}]`} />
                        ))}
                    </div>
                ) : (
                    <div className="faq__list faq__list--plain">
                        {items.map((item, i) => (
                            <FAQPlainItem key={i} item={item} prefix={`items[${i}]`} />
                        ))}
                    </div>
                )}
                <button
                    className="edit__add-item"
                    data-edit-only=""
                    onClick={() => addItem(blockIndex, 'items', FAQDefaults.items[0])}
                    title="Add FAQ item"
                >+</button>
            </div>
        </div>
    );
}

interface FAQItemProps { item: FAQItem; prefix: string; }

function FAQAccordionItem({ item, prefix }: FAQItemProps) {
    const questionEdit = useEditableText(`${prefix}.question`);
    const answerEdit   = useEditableText(`${prefix}.answer`);
    return (
        <details className="faq__item">
            <summary className="faq__question" {...questionEdit}>{item.question}</summary>
            <div className="faq__answer" {...answerEdit}>{item.answer}</div>
        </details>
    );
}

function FAQPlainItem({ item, prefix }: FAQItemProps) {
    const questionEdit = useEditableText(`${prefix}.question`);
    const answerEdit   = useEditableText(`${prefix}.answer`);
    return (
        <div className="faq__item">
            <h3 className="faq__question" {...questionEdit}>{item.question}</h3>
            <div className="faq__answer" {...answerEdit}>{item.answer}</div>
        </div>
    );
}
