import type { ComponentType } from 'react';

// Layout
import Header           from '../elements/layout/Header/Header';
import HeroBanner       from '../elements/layout/HeroBanner/HeroBanner';
import Container        from '../elements/layout/Container/Container';
import Footer           from '../elements/layout/Footer/Footer';
import HeroPerspective  from '../elements/layout/HeroPerspective/HeroPerspective';

// Content
import TextBlock          from '../elements/content/TextBlock/TextBlock';
import MediaText          from '../elements/content/MediaText/MediaText';
import CardRow            from '../elements/content/CardRow/CardRow';
import CardGrid           from '../elements/content/CardGrid/CardGrid';
import Spotlight          from '../elements/content/Spotlight/Spotlight';
import Testimonial        from '../elements/content/Testimonial/Testimonial';
import StatRow            from '../elements/content/StatRow/StatRow';
import FeatureGrid        from '../elements/content/FeatureGrid/FeatureGrid';
import CTABand            from '../elements/content/CTABand/CTABand';
import Showcase           from '../elements/content/Showcase/Showcase';
import Pricing            from '../elements/content/Pricing/Pricing';
import FAQ                from '../elements/content/FAQ/FAQ';
import BentoGrid          from '../elements/content/BentoGrid/BentoGrid';
import ComparisonTable    from '../elements/content/ComparisonTable/ComparisonTable';
import TeamGrid           from '../elements/content/TeamGrid/TeamGrid';
import SocialProofBand    from '../elements/content/SocialProofBand/SocialProofBand';
import AboutVisionMission from '../elements/content/AboutVisionMission/AboutVisionMission';
import Newsletter         from '../elements/content/Newsletter/Newsletter';
import ProductTour        from '../elements/content/ProductTour/ProductTour';
import Pill               from '../elements/content/Pill/Pill';
import ProductHuntAward   from '../elements/content/ProductHuntAward/ProductHuntAward';
import RatingBadge        from '../elements/content/RatingBadge/RatingBadge';
import DiscountStrip      from '../elements/content/DiscountStrip/DiscountStrip';
import Timeline           from '../elements/content/Timeline/Timeline';

// Media
import ImageBlock   from '../elements/media/ImageBlock/ImageBlock';
import Gallery      from '../elements/media/Gallery/Gallery';
import LogoStrip    from '../elements/media/LogoStrip/LogoStrip';
import Marquee      from '../elements/media/Marquee/Marquee';
import VideoFeature from '../elements/media/VideoFeature/VideoFeature';

/**
 * Single source of React-component lookups per module type.
 * Registry composes these with the shared spec registry (schema + meta + defaults)
 * to produce `ModuleDefinition` objects at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMap: Record<string, ComponentType<any>> = {
    // Layout
    Header,
    HeroBanner,
    Container,
    Footer,
    HeroPerspective,
    // Content
    TextBlock,
    MediaText,
    CardRow,
    CardGrid,
    Spotlight,
    Testimonial,
    StatRow,
    FeatureGrid,
    CTABand,
    Showcase,
    Pricing,
    FAQ,
    BentoGrid,
    ComparisonTable,
    TeamGrid,
    SocialProofBand,
    AboutVisionMission,
    Newsletter,
    ProductTour,
    Pill,
    ProductHuntAward,
    RatingBadge,
    DiscountStrip,
    Timeline,
    // Media
    ImageBlock,
    Gallery,
    LogoStrip,
    Marquee,
    VideoFeature,
};
