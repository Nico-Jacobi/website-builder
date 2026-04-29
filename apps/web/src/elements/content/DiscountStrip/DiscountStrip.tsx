import './DiscountStrip.css';
import type { DiscountStripProps } from '@website-builder/shared';

export default function DiscountStrip({ label, code, expiresLabel, animated, tone }: DiscountStripProps) {
    const classes = [
        'section',
        'discount_strip',
        `discount_strip--${tone}`,
        animated ? 'discount_strip--animated' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <div className="discount_strip__inner">
                <span className="discount_strip__label">{label}</span>
                {code && (
                    <span className="discount_strip__code">
                        Code: <code>{code}</code>
                    </span>
                )}
                {expiresLabel && (
                    <span className="discount_strip__expires">{expiresLabel}</span>
                )}
            </div>
        </div>
    );
}
