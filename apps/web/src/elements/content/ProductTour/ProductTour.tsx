import { useState } from 'react';
import './ProductTour.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { ProductTourDefaults } from '@website-builder/shared';
import type { ProductTourProps, ProductTourTab } from '@website-builder/shared';

export default function ProductTour({ heading, subheading, tabs }: ProductTourProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    const [activeIndex, setActiveIndex] = useState(0);
    const safeIndex = Math.min(activeIndex, tabs.length - 1);
    const active    = tabs[safeIndex];

    return (
        <div className="section section--wide product_tour">
            {(heading || subheading) && (
                <header className="product_tour__header">
                    {heading && <h2 className="product_tour__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="product_tour__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <div className="product_tour__tablist" role="tablist">
                {tabs.map((tab, i) => (
                    <TabButton key={i} tab={tab} index={i} active={i === safeIndex} onSelect={setActiveIndex} prefix={`tabs[${i}]`} />
                ))}
            </div>
            <ActivePanel tab={active} prefix={`tabs[${safeIndex}]`} />
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'tabs', ProductTourDefaults.tabs[0])}
                title="Add tab"
            >+</button>
        </div>
    );
}

interface TabButtonProps {
    tab: ProductTourTab;
    index: number;
    active: boolean;
    onSelect: (i: number) => void;
    prefix: string;
}

function TabButton({ tab, index, active, onSelect, prefix }: TabButtonProps) {
    const labelEdit = useEditableText(`${prefix}.label`);
    return (
        <button
            role="tab"
            aria-selected={active}
            className={`product_tour__tab${active ? ' product_tour__tab--active' : ''}`}
            onClick={() => onSelect(index)}
            {...labelEdit}
        >
            {tab.label}
        </button>
    );
}

function ActivePanel({ tab, prefix }: { tab: ProductTourTab; prefix: string }) {
    const titleEdit = useEditableText(`${prefix}.title`);
    const bodyEdit  = useEditableText(`${prefix}.body`);
    return (
        <div className="product_tour__panel">
            <div className="product_tour__copy">
                <h3 className="product_tour__title" {...titleEdit}>{tab.title}</h3>
                <p className="product_tour__body" {...bodyEdit}>{tab.body}</p>
            </div>
            <EditableImage
                path={`${prefix}.imageSrc`}
                src={tab.imageSrc}
                alt={tab.imageAlt ?? ''}
                altPath={`${prefix}.imageAlt`}
                wrapperClassName="product_tour__media"
                imgClassName="perspective-right"
            />
        </div>
    );
}
