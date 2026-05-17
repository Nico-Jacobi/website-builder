import './Timeline.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { TimelineDefaults } from '@website-builder/shared';
import type { TimelineProps, TimelineEntry } from '@website-builder/shared';

export default function Timeline({ heading, subheading, entries }: TimelineProps) {
    const { t }          = useTranslation();
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section section--narrow timeline">
            {(heading || subheading) && (
                <header className="timeline__header">
                    {heading && <h2 className="timeline__heading section__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="timeline__subheading section__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <ol className="timeline__list">
                {entries.map((entry, i) => (
                    <TimelineEntryItem key={i} entry={entry} prefix={`entries[${i}]`} />
                ))}
            </ol>
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'entries', TimelineDefaults.entries[0])}
                title={t('modules.content.timeline.addItemLabel')}
            >+</button>
        </div>
    );
}

interface TimelineEntryItemProps { entry: TimelineEntry; prefix: string; }

function TimelineEntryItem({ entry, prefix }: TimelineEntryItemProps) {
    const dateEdit  = useEditableText(`${prefix}.date`);
    const titleEdit = useEditableText(`${prefix}.title`);
    const bodyEdit  = useEditableText(`${prefix}.body`);
    return (
        <li className="timeline__entry">
            <div className="timeline__dot" />
            <div className="timeline__content">
                <span className="timeline__date" {...dateEdit}>{entry.date}</span>
                <h3 className="timeline__title" {...titleEdit}>{entry.title}</h3>
                {entry.body && <p className="timeline__body" {...bodyEdit}>{entry.body}</p>}
            </div>
        </li>
    );
}
