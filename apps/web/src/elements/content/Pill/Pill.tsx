import './Pill.css';
import type { PillProps } from '@website-builder/shared';

export default function Pill({ label, variant, align }: PillProps) {
    return (
        <div className={`section pill_block pill_block--align-${align}`}>
            <span className={`pill_block__pill pill_block__pill--${variant}`}>{label}</span>
        </div>
    );
}
