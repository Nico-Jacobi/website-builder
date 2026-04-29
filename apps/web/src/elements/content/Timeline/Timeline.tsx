import './Timeline.css';
import type { TimelineProps } from '@website-builder/shared';

export default function Timeline({ heading, subheading, entries }: TimelineProps) {
    return (
        <div className="section section--narrow timeline">
            {(heading || subheading) && (
                <header className="timeline__header">
                    {heading && <h2 className="timeline__heading">{heading}</h2>}
                    {subheading && <p className="timeline__subheading">{subheading}</p>}
                </header>
            )}
            <ol className="timeline__list">
                {entries.map((entry, i) => (
                    <li key={i} className="timeline__entry">
                        <div className="timeline__dot" />
                        <div className="timeline__content">
                            <span className="timeline__date">{entry.date}</span>
                            <h3 className="timeline__title">{entry.title}</h3>
                            {entry.body && <p className="timeline__body">{entry.body}</p>}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
