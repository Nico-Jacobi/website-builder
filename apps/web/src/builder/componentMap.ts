import type { ComponentType } from 'react';

// Layout (4)
import Header     from '../elements/layout/Header/Header';
import HeroBanner from '../elements/layout/HeroBanner/HeroBanner';
import Container  from '../elements/layout/Container/Container';
import Footer     from '../elements/layout/Footer/Footer';

// Content (9)
import TextBlock   from '../elements/content/TextBlock/TextBlock';
import MediaText   from '../elements/content/MediaText/MediaText';
import CardRow     from '../elements/content/CardRow/CardRow';
import CardGrid    from '../elements/content/CardGrid/CardGrid';
import Spotlight   from '../elements/content/Spotlight/Spotlight';
import Testimonial from '../elements/content/Testimonial/Testimonial';
import StatRow    from '../elements/content/StatRow/StatRow';
import FeatureGrid from '../elements/content/FeatureGrid/FeatureGrid';
import CTABand     from '../elements/content/CTABand/CTABand';

// Media (3)
import ImageBlock from '../elements/media/ImageBlock/ImageBlock';
import Gallery    from '../elements/media/Gallery/Gallery';
import LogoStrip  from '../elements/media/LogoStrip/LogoStrip';

/**
 * Single source of React-component lookups per module type.
 * Registry composes these with the shared spec registry (schema + meta + defaults)
 * to produce `ModuleDefinition` objects at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMap: Record<string, ComponentType<any>> = {
    Header,
    HeroBanner,
    Container,
    Footer,
    TextBlock,
    MediaText,
    CardRow,
    CardGrid,
    Spotlight,
    Testimonial,
    StatRow,
    ImageBlock,
    Gallery,
    LogoStrip,
    FeatureGrid,
    CTABand,
};
