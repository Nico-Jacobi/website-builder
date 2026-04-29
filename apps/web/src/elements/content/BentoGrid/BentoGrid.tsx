import './BentoGrid.css';
import type { BentoGridProps } from '@website-builder/shared';

export default function BentoGrid({ heading, subheading, cells }: BentoGridProps) {
    return (
        <div className="section bento_grid">
            {(heading || subheading) && (
                <header className="bento_grid__header">
                    {heading && <h2 className="bento_grid__heading">{heading}</h2>}
                    {subheading && <p className="bento_grid__subheading">{subheading}</p>}
                </header>
            )}
            <div className="bento_grid__grid">
                {cells.map((cell, i) => (
                    <article
                        key={i}
                        className={`bento_grid__cell bento_grid__cell--${cell.span}${cell.accent ? ' bento_grid__cell--accent' : ''}`}
                    >
                        {cell.imageSrc && (
                            <div className="bento_grid__media">
                                <img src={cell.imageSrc} alt={cell.imageAlt ?? ''} />
                            </div>
                        )}
                        <div className="bento_grid__copy">
                            <h3 className="bento_grid__title">{cell.title}</h3>
                            {cell.body && <p className="bento_grid__body">{cell.body}</p>}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
