import './Marquee.css';
import type { MarqueeProps, MarqueeItem } from '@website-builder/shared';

function renderItem(item: MarqueeItem, style: MarqueeProps['style'], key: string | number) {
    const inner = style === 'image' && item.imageSrc
        ? <img src={item.imageSrc} alt={item.imageAlt ?? ''} />
        : <span className={`marquee__label marquee__label--${style}`}>{item.text ?? ''}</span>;

    return item.href
        ? <a key={key} className="marquee__item" href={item.href}>{inner}</a>
        : <span key={key} className="marquee__item">{inner}</span>;
}

export default function Marquee({ items, direction, speed, pauseOnHover, style }: MarqueeProps) {
    const trackClasses = [
        'marquee__track',
        `marquee__track--${speed}`,
        direction === 'right' ? 'marquee__track--reverse' : '',
    ].filter(Boolean).join(' ');

    const sectionClasses = [
        'section',
        'marquee',
        pauseOnHover ? 'marquee--pause-on-hover' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={sectionClasses}>
            <div className="marquee__viewport">
                <div className={trackClasses} aria-hidden="false">
                    {items.map((item, i) => renderItem(item, style, `a-${i}`))}
                    {items.map((item, i) => renderItem(item, style, `b-${i}`))}
                </div>
            </div>
        </div>
    );
}
