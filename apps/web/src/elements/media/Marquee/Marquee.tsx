import './Marquee.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditableImage } from '../../../builder/useEditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { MarqueeDefaults } from '@website-builder/shared';
import type { MarqueeProps, MarqueeItem } from '@website-builder/shared';

function renderItemGhost(item: MarqueeItem, style: MarqueeProps['style'], key: string | number) {
    const inner = style === 'image' && item.imageSrc
        ? <img src={item.imageSrc} alt={item.imageAlt ?? ''} />
        : <span className={`marquee__label marquee__label--${style}`}>{item.text ?? ''}</span>;

    return item.href
        ? <a key={key} className="marquee__item" href={item.href} aria-hidden="true" tabIndex={-1}>{inner}</a>
        : <span key={key} className="marquee__item" aria-hidden="true">{inner}</span>;
}

export default function Marquee({ items, direction, speed, pauseOnHover, style }: MarqueeProps) {
    const { t }       = useTranslation();
    const { addItem } = useEditModeActions();
    const blockIndex  = useBlockIndex();

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
                <div className={trackClasses}>
                    {items.map((item, i) => (
                        <MarqueeItemCard key={`a-${i}`} item={item} prefix={`items[${i}]`} style={style} />
                    ))}
                    {/* duplicate set for seamless loop — aria-hidden */}
                    {items.map((item, i) => renderItemGhost(item, style, `b-${i}`))}
                </div>
            </div>
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'items', MarqueeDefaults.items[0])}
                title={t('modules.media.marquee.addItemLabel')}
            >+</button>
        </div>
    );
}

interface MarqueeItemCardProps {
    item: MarqueeItem;
    prefix: string;
    style: MarqueeProps['style'];
}

function MarqueeItemCard({ item, prefix, style }: MarqueeItemCardProps) {
    const textEdit = useEditableText(`${prefix}.text`);
    const { overlayElement: imgOverlay } = useEditableImage(
        item.imageSrc ?? '',
        `${prefix}.imageSrc`,
        `${prefix}.imageAlt`,
        item.imageAlt ?? '',
    );

    const inner = style === 'image' && item.imageSrc
        ? <img src={item.imageSrc} alt={item.imageAlt ?? ''} />
        : <span className={`marquee__label marquee__label--${style}`} {...textEdit}>{item.text ?? ''}</span>;

    const content = <>{inner}{imgOverlay}</>;

    return item.href
        ? <a className="marquee__item" href={item.href}>{content}</a>
        : <span className="marquee__item">{content}</span>;
}
