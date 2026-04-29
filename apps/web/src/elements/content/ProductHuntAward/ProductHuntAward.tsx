import './ProductHuntAward.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { ProductHuntAwardProps } from '@website-builder/shared';

export default function ProductHuntAward({ rank, period, productName, href, size, variant }: ProductHuntAwardProps) {
    const productNameEdit = useEditableText('productName');

    const inner = (
        <div className={`ph_award ph_award--${size} ph_award--${variant}`}>
            <span className="ph_award__rank">{rank}</span>
            <div className="ph_award__text">
                <span className="ph_award__overline">Product of the</span>
                <span className="ph_award__period">{period}</span>
                {productName && <span className="ph_award__product" {...productNameEdit}>{productName}</span>}
            </div>
        </div>
    );

    return (
        <div className="section ph_award_block">
            {href ? <a className="ph_award__link" href={href}>{inner}</a> : inner}
        </div>
    );
}
