import './Pricing.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableLink } from '../../shared/EditableLink';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { PricingDefaults } from '@website-builder/shared';
import type { PricingProps, PricingTier } from '@website-builder/shared';

export default function Pricing({ heading, subheading, tiers }: PricingProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section pricing">
            {(heading || subheading) && (
                <header className="pricing__header">
                    {heading && <h2 className="pricing__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="pricing__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <div className="pricing__grid">
                {tiers.map((tier, i) => (
                    <PricingTierCard key={i} tier={tier} prefix={`tiers[${i}]`} />
                ))}
            </div>
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'tiers', PricingDefaults.tiers[0])}
                title="Add pricing tier"
            >+</button>
        </div>
    );
}

interface PricingTierCardProps { tier: PricingTier; prefix: string; }

function PricingTierCard({ tier, prefix }: PricingTierCardProps) {
    const highlightEdit = useEditableText(`${prefix}.highlight`);
    const nameEdit      = useEditableText(`${prefix}.name`);
    const priceEdit     = useEditableText(`${prefix}.price`);
    const periodEdit    = useEditableText(`${prefix}.period`);

    return (
        <article className={`pricing__tier${tier.featured ? ' pricing__tier--featured' : ''}`}>
            {tier.highlight && (
                <span className="pricing__highlight" {...highlightEdit}>{tier.highlight}</span>
            )}
            <h3 className="pricing__name" {...nameEdit}>{tier.name}</h3>
            <div className="pricing__price-row">
                <span className="pricing__price" {...priceEdit}>{tier.price}</span>
                {tier.period && (
                    <span className="pricing__period" {...periodEdit}>{tier.period}</span>
                )}
            </div>
            <ul className="pricing__features">
                {tier.features.map((feature, j) => (
                    <PricingFeatureItem key={j} feature={feature} path={`${prefix}.features[${j}]`} />
                ))}
            </ul>
            <EditableLink
                className="pricing__cta"
                href={tier.cta.href}
                label={tier.cta.label}
                labelPath={`${prefix}.cta.label`}
            />
        </article>
    );
}

function PricingFeatureItem({ feature, path }: { feature: string; path: string }) {
    const featureEdit = useEditableText(path);
    return <li className="pricing__feature" {...featureEdit}>{feature}</li>;
}
