import './TextBlock.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { TextBlockProps } from '@website-builder/shared';

export default function TextBlock({ overline, heading, body, subtext, align }: TextBlockProps) {
    const overlineEdit = useEditableText('overline');
    const headingEdit = useEditableText('heading');
    const bodyEdit = useEditableText('body');
    const subtextEdit = useEditableText('subtext');

    return (
        <div className="section text_block" data-align={align}>
            <span
                className="text_block__overline"
                data-empty={!overline || undefined}
                data-placeholder="Kurztitel"
                {...overlineEdit}
            >{overline}</span>
            <h2
                className="text_block__heading"
                data-empty={!heading || undefined}
                data-placeholder="Überschrift"
                {...headingEdit}
            >{heading}</h2>
            <p className="text_block__body" {...bodyEdit}>{body}</p>
            <p
                className="text_block__subtext"
                data-empty={!subtext || undefined}
                data-placeholder="Untertext"
                {...subtextEdit}
            >{subtext}</p>
        </div>
    );
}
