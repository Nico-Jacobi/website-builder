import './LogoStrip.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { LogoStripProps, LogoItem } from '@website-builder/shared';

export default function LogoStrip({ heading, logos, marquee }: LogoStripProps) {
    const { t } = useTranslation();
    const headingEdit = useEditableText('heading');

    return (
        <div className="logo_strip" data-marquee={marquee ? 'true' : undefined}>
            <p
                className="logo_strip__heading"
                data-empty={!heading || undefined}
                data-placeholder={t('modules.media.logoStrip.headingPlaceholder')}
                {...headingEdit}
            >{heading}</p>
            <div
                className="logo_strip__logos"
                aria-label={marquee ? t('modules.media.logoStrip.partnerLogosAriaLabel') : undefined}
            >
                {logos.map((logo, index) => (
                    <LogoItemView key={index} logo={logo} index={index} />
                ))}
                {/* Gedoppelte Logos für nahtlose Marquee-Schleife */}
                {marquee && logos.map((logo, index) => (
                    <LogoItemView
                        key={`dup-${index}`}
                        logo={logo}
                        index={index}
                        ariaHidden
                    />
                ))}
            </div>
        </div>
    );
}

function LogoItemView({
    logo,
    index,
    ariaHidden,
}: {
    logo: LogoItem;
    index: number;
    ariaHidden?: boolean;
}) {
    const nameEdit = useEditableText(`logos[${index}].name`);

    return (
        <div
            className="logo_strip__item"
            aria-hidden={ariaHidden || undefined}
        >
            <EditableImage
                path={`logos[${index}].src`}
                src={logo.src}
                alt={logo.alt ?? logo.name}
                altPath={`logos[${index}].alt`}
                wrapperClassName="logo_strip__img-wrap"
                imgClassName="logo_strip__img"
            />
            <span
                className="logo_strip__name"
                data-empty={logo.src ? '' : undefined}
                {...(ariaHidden ? {} : nameEdit)}
            >{logo.name}</span>
        </div>
    );
}
