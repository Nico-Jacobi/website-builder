import './FeatureGrid.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { FeatureGridProps, FeatureItem } from '@website-builder/shared';

export default function FeatureGrid({
    heading,
    subheading,
    features,
    columns,
}: FeatureGridProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');

    const hasHeader = heading !== undefined || subheading !== undefined;

    return (
        <div className="section feature_grid">
            {hasHeader && (
                <div className="feature_grid__header">
                    {heading !== undefined && (
                        <h2
                            className="feature_grid__heading"
                            data-empty={!heading || undefined}
                            data-placeholder="Überschrift"
                            {...headingEdit}
                        >{heading}</h2>
                    )}
                    {subheading !== undefined && (
                        <p
                            className="feature_grid__subheading"
                            data-empty={!subheading || undefined}
                            data-placeholder="Unterüberschrift"
                            {...subheadingEdit}
                        >{subheading}</p>
                    )}
                </div>
            )}
            <div
                className="feature_grid__grid"
                style={{ '--fg-cols': columns } as React.CSSProperties}
            >
                {features.map((feature, index) => (
                    <FeatureTile key={index} feature={feature} index={index} />
                ))}
            </div>
        </div>
    );
}

function FeatureTile({
    feature,
    index,
}: {
    feature: FeatureItem;
    index: number;
}) {
    const iconEdit    = useEditableText(`features[${index}].icon`);
    const headingEdit = useEditableText(`features[${index}].heading`);
    const bodyEdit    = useEditableText(`features[${index}].body`);

    return (
        <div className="feature_grid__tile">
            <span className="feature_grid__icon" {...iconEdit}>
                {feature.icon}
            </span>
            <h3 className="feature_grid__tile-heading" {...headingEdit}>
                {feature.heading}
            </h3>
            <p className="feature_grid__tile-body" {...bodyEdit}>
                {feature.body}
            </p>
        </div>
    );
}
