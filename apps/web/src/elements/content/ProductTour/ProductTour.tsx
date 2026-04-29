import { useState } from 'react';
import './ProductTour.css';
import type { ProductTourProps } from '@website-builder/shared';

export default function ProductTour({ heading, subheading, tabs }: ProductTourProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const active = tabs[activeIndex] ?? tabs[0];

    return (
        <div className="section section--wide product_tour">
            {(heading || subheading) && (
                <header className="product_tour__header">
                    {heading && <h2 className="product_tour__heading">{heading}</h2>}
                    {subheading && <p className="product_tour__subheading">{subheading}</p>}
                </header>
            )}
            <div className="product_tour__tablist" role="tablist">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={i === activeIndex}
                        className={`product_tour__tab${i === activeIndex ? ' product_tour__tab--active' : ''}`}
                        onClick={() => setActiveIndex(i)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="product_tour__panel">
                <div className="product_tour__copy">
                    <h3 className="product_tour__title">{active.title}</h3>
                    <p className="product_tour__body">{active.body}</p>
                </div>
                {active.imageSrc && (
                    <div className="product_tour__media">
                        <img src={active.imageSrc} alt={active.imageAlt ?? ''} className="perspective-right" />
                    </div>
                )}
            </div>
        </div>
    );
}
