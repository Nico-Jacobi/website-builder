import './TextBlock.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { TextBlockProps } from './TextBlock.schema';

export default function TextBlock({ eyebrow, heading, body, subtext, align }: TextBlockProps) {
    const eyebrowEdit = useEditableText('eyebrow');
    const headingEdit = useEditableText('heading');
    const bodyEdit = useEditableText('body');
    const subtextEdit = useEditableText('subtext');

    return (
        <div className="section text_block" data-align={align}>
            <span
                className="text_block__eyebrow"
                data-empty={!eyebrow || undefined}
                data-placeholder="Eyebrow"
                {...eyebrowEdit}
            >{eyebrow}</span>
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
