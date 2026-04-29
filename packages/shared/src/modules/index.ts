import type { ZodType } from 'zod';
import type { ModuleMeta, ContentField } from '../types';

/**
 * React-freie Beschreibung eines Moduls. Backend + Frontend konsumieren
 * diese Struktur; Frontend komponiert sie zur Laufzeit mit einer React-
 * Komponente zu einer `ModuleDefinition`.
 */
export interface ModuleSpec<P = unknown> {
    meta:          ModuleMeta;
    propsSchema:   ZodType<P>;
    defaults:      P;
    contentFields?: ContentField[];
}

// Per-Modul-Re-Exports (Schema, Defaults, Meta, ContentFields, ModuleSpec).
export * from './Header';
export * from './HeroBanner';
export * from './Container';
export * from './Footer';
export * from './TextBlock';
export * from './MediaText';
export * from './CardRow';
export * from './CardGrid';
export * from './Spotlight';
export * from './Testimonial';
export * from './StatRow';
export * from './ImageBlock';
export * from './Gallery';
export * from './LogoStrip';
export * from './FeatureGrid';
export * from './CTABand';
// Page-UI inspired additions
export * from './Showcase';
export * from './Pricing';
export * from './FAQ';
export * from './BentoGrid';
export * from './ComparisonTable';
export * from './TeamGrid';
export * from './HeroPerspective';
export * from './Marquee';
export * from './SocialProofBand';
export * from './AboutVisionMission';
export * from './VideoFeature';
export * from './Newsletter';
export * from './ProductTour';
export * from './Pill';
export * from './ProductHuntAward';
export * from './RatingBadge';
export * from './DiscountStrip';
export * from './Timeline';

import { HeaderModuleSpec       } from './Header';
import { HeroBannerModuleSpec   } from './HeroBanner';
import { ContainerModuleSpec    } from './Container';
import { FooterModuleSpec       } from './Footer';
import { TextBlockModuleSpec    } from './TextBlock';
import { MediaTextModuleSpec    } from './MediaText';
import { CardRowModuleSpec      } from './CardRow';
import { CardGridModuleSpec     } from './CardGrid';
import { SpotlightModuleSpec    } from './Spotlight';
import { TestimonialModuleSpec  } from './Testimonial';
import { StatRowModuleSpec      } from './StatRow';
import { ImageBlockModuleSpec   } from './ImageBlock';
import { GalleryModuleSpec      } from './Gallery';
import { LogoStripModuleSpec    } from './LogoStrip';
import { FeatureGridModuleSpec  } from './FeatureGrid';
import { CTABandModuleSpec      } from './CTABand';
import { ShowcaseModuleSpec           } from './Showcase';
import { PricingModuleSpec            } from './Pricing';
import { FAQModuleSpec                } from './FAQ';
import { BentoGridModuleSpec          } from './BentoGrid';
import { ComparisonTableModuleSpec    } from './ComparisonTable';
import { TeamGridModuleSpec           } from './TeamGrid';
import { HeroPerspectiveModuleSpec    } from './HeroPerspective';
import { MarqueeModuleSpec            } from './Marquee';
import { SocialProofBandModuleSpec    } from './SocialProofBand';
import { AboutVisionMissionModuleSpec } from './AboutVisionMission';
import { VideoFeatureModuleSpec       } from './VideoFeature';
import { NewsletterModuleSpec         } from './Newsletter';
import { ProductTourModuleSpec        } from './ProductTour';
import { PillModuleSpec               } from './Pill';
import { ProductHuntAwardModuleSpec   } from './ProductHuntAward';
import { RatingBadgeModuleSpec        } from './RatingBadge';
import { DiscountStripModuleSpec      } from './DiscountStrip';
import { TimelineModuleSpec           } from './Timeline';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allSpecs: ModuleSpec<any>[] = [
    HeaderModuleSpec,    HeroBannerModuleSpec, ContainerModuleSpec,
    FooterModuleSpec,    TextBlockModuleSpec,  MediaTextModuleSpec,
    CardRowModuleSpec,   CardGridModuleSpec,   SpotlightModuleSpec,
    TestimonialModuleSpec, StatRowModuleSpec,  ImageBlockModuleSpec,
    GalleryModuleSpec,   LogoStripModuleSpec,  FeatureGridModuleSpec,
    CTABandModuleSpec,
    // Page-UI inspired additions
    ShowcaseModuleSpec,        PricingModuleSpec,         FAQModuleSpec,
    BentoGridModuleSpec,       ComparisonTableModuleSpec, TeamGridModuleSpec,
    HeroPerspectiveModuleSpec, MarqueeModuleSpec,         SocialProofBandModuleSpec,
    AboutVisionMissionModuleSpec, VideoFeatureModuleSpec, NewsletterModuleSpec,
    ProductTourModuleSpec,     PillModuleSpec,            ProductHuntAwardModuleSpec,
    RatingBadgeModuleSpec,     DiscountStripModuleSpec,   TimelineModuleSpec,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sharedModuleRegistry: Record<string, ModuleSpec<any>> =
    Object.fromEntries(allSpecs.map((s) => [s.meta.name, s]));

export function getSharedModule(name: string): ModuleSpec | undefined {
    return sharedModuleRegistry[name];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function listSharedModules(): ModuleSpec<any>[] {
    return allSpecs;
}
