import './FAQ.css';
import type { FAQProps } from '@website-builder/shared';

export default function FAQ({ heading, subheading, items, layout }: FAQProps) {
    return (
        <div className="section section--narrow faq">
            <div className="faq__inner">
                {(heading || subheading) && (
                    <header className="faq__header">
                        {heading && <h2 className="faq__heading">{heading}</h2>}
                        {subheading && <p className="faq__subheading">{subheading}</p>}
                    </header>
                )}

                {layout === 'accordion' ? (
                    <div className="faq__list faq__list--accordion">
                        {items.map((item, i) => (
                            <details key={i} className="faq__item">
                                <summary className="faq__question">{item.question}</summary>
                                <div className="faq__answer">{item.answer}</div>
                            </details>
                        ))}
                    </div>
                ) : (
                    <div className="faq__list faq__list--plain">
                        {items.map((item, i) => (
                            <div key={i} className="faq__item">
                                <h3 className="faq__question">{item.question}</h3>
                                <div className="faq__answer">{item.answer}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
