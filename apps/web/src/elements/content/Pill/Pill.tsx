import './Pill.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { PillProps } from '@website-builder/shared';

export default function Pill({ label, variant, align }: PillProps) {
    const labelEdit = useEditableText('label');
    return (
        <div className={`section pill_block pill_block--align-${align}`}>
            <span className={`pill_block__pill pill_block__pill--${variant}`} {...labelEdit}>{label}</span>
        </div>
    );
}
