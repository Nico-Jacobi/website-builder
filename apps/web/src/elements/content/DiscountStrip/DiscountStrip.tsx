import './DiscountStrip.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { DiscountStripProps } from '@website-builder/shared';

export default function DiscountStrip({ label, code, expiresLabel, animated, tone }: DiscountStripProps) {
    const labelEdit       = useEditableText('label');
    const codeEdit        = useEditableText('code');
    const expiresEdit     = useEditableText('expiresLabel');

    const classes = [
        'section',
        'discount_strip',
        `discount_strip--${tone}`,
        animated ? 'discount_strip--animated' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <div className="discount_strip__inner">
                <span className="discount_strip__label" {...labelEdit}>{label}</span>
                {code && (
                    <span className="discount_strip__code">
                        Code: <code {...codeEdit}>{code}</code>
                    </span>
                )}
                {expiresLabel && (
                    <span className="discount_strip__expires" {...expiresEdit}>{expiresLabel}</span>
                )}
            </div>
        </div>
    );
}
