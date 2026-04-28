import './TextBlock.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditModeState } from '../../../builder/editModeStore';
import type { TextBlockProps } from '@website-builder/shared';

export default function TextBlock({ overline, heading, body, subtext, align, actionLabel, actionHref }: TextBlockProps) {
    const { t } = useTranslation();
    const { isEditMode }  = useEditModeState();
    const overlineEdit    = useEditableText('overline');
    const headingEdit     = useEditableText('heading');
    const bodyEdit        = useEditableText('body');
    const subtextEdit     = useEditableText('subtext');
    const actionLabelEdit = useEditableText('actionLabel');

    const showAction = isEditMode || !!actionLabel;

    return (
        <div className="section text_block" data-align={align}>
            <span
                className="text_block__overline"
                data-empty={!overline || undefined}
                data-placeholder={t('modules.content.textBlock.overlinePlaceholder')}
                {...overlineEdit}
            >{overline}</span>
            <h2
                className="text_block__heading"
                data-empty={!heading || undefined}
                data-placeholder={t('modules.content.textBlock.headingPlaceholder')}
                {...headingEdit}
            >{heading}</h2>
            <p className="text_block__body" {...bodyEdit}>{body}</p>
            <p
                className="text_block__subtext"
                data-empty={!subtext || undefined}
                data-placeholder={t('modules.content.textBlock.subtextPlaceholder')}
                {...subtextEdit}
            >{subtext}</p>
            {showAction && (
                <a
                    className="text_block__action"
                    href={actionHref || '#'}
                    data-empty={!actionLabel || undefined}
                    data-placeholder={t('modules.content.textBlock.actionPlaceholder')}
                    {...actionLabelEdit}
                >{actionLabel}{actionLabel ? ' →' : ''}</a>
            )}
        </div>
    );
}
