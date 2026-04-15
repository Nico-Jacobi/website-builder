import './Callout.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { CalloutProps } from './Callout.schema';

export default function Callout({ icon, heading, body, tone }: CalloutProps) {
    const iconEdit = useEditableText('icon');
    const headingEdit = useEditableText('heading');
    const bodyEdit = useEditableText('body');

    return (
        <div className="callout" data-tone={tone}>
            {icon && <span className="callout__icon" {...iconEdit}>{icon}</span>}
            <div className="callout__content">
                {heading && <p className="callout__heading" {...headingEdit}>{heading}</p>}
                <p className="callout__body" {...bodyEdit}>{body}</p>
            </div>
        </div>
    );
}
