import './Pricing.css';
import type { PricingProps } from '@website-builder/shared';

export default function Pricing({ heading, subheading, tiers }: PricingProps) {
    return (
        <div className="section pricing">
            {(heading || subheading) && (
                <header className="pricing__header">
                    {heading && <h2 className="pricing__heading">{heading}</h2>}
                    {subheading && <p className="pricing__subheading">{subheading}</p>}
                </header>
            )}
            <div className="pricing__grid">
                {tiers.map((tier, i) => (
                    <article
                        key={i}
                        className={`pricing__tier${tier.featured ? ' pricing__tier--featured' : ''}`}
                    >
                        {tier.highlight && (
                            <span className="pricing__highlight">{tier.highlight}</span>
                        )}
                        <h3 className="pricing__name">{tier.name}</h3>
                        <div className="pricing__price-row">
                            <span className="pricing__price">{tier.price}</span>
                            {tier.period && (
                                <span className="pricing__period">{tier.period}</span>
                            )}
                        </div>
                        <ul className="pricing__features">
                            {tier.features.map((feature, j) => (
                                <li key={j} className="pricing__feature">{feature}</li>
                            ))}
                        </ul>
                        <a className="pricing__cta" href={tier.cta.href}>
                            {tier.cta.label}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
