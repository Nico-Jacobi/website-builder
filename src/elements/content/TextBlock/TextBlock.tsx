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
            {eyebrow && <span className="text_block__eyebrow" {...eyebrowEdit}>{eyebrow}</span>}
            {heading && <h2 className="text_block__heading" {...headingEdit}>{heading}</h2>}
            <p className="text_block__body" {...bodyEdit}>{body}</p>
            {subtext && <p className="text_block__subtext" {...subtextEdit}>{subtext}</p>}
        </div>
    );
}
