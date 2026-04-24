import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EditModeProvider } from '../builder/EditModeContext';
import type { SiteSpec } from '../builder/schemas';

afterEach(cleanup);

// Layout modules
import { Header } from './layout/Header';
import { HeroBanner } from './layout/HeroBanner';
import { Container } from './layout/Container';
import { Footer } from './layout/Footer';
import { FooterSimple } from './layout/FooterSimple';

// Content modules
import { TextBlock } from './content/TextBlock';
import { MediaText } from './content/MediaText';
import { CardRow } from './content/CardRow';
import { CardGrid } from './content/CardGrid';
import Spotlight from './content/Spotlight/Spotlight';
import RecommendationRow from './content/RecommendationRow/RecommendationRow';
import { StatRow } from './content/StatRow';

// Media modules
import { ImageBlock } from './media/ImageBlock';
import { Gallery } from './media/Gallery';

const EMPTY_SPEC: SiteSpec = { blocks: [] };

function renderInProvider(ui: React.ReactElement) {
    return render(
        <EditModeProvider spec={EMPTY_SPEC} onSpecChange={() => {}}>
            {ui}
        </EditModeProvider>
    );
}

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------
describe('Header', () => {
    it('renders the title in an h1', () => {
        renderInProvider(<Header title="My Website" />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Website');
    });

    it('renders subtitle when provided', () => {
        renderInProvider(<Header title="My Website" subtitle="A tagline" />);
        expect(screen.getByText('A tagline')).toBeInTheDocument();
    });

    it('does not render nav when no links are provided', () => {
        renderInProvider(<Header title="My Website" />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('renders nav with links when provided', () => {
        const links = [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
        ];
        renderInProvider(<Header title="My Website" links={links} />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByText('Home')).toHaveAttribute('href', '/');
        expect(screen.getByText('About')).toHaveAttribute('href', '/about');
    });

    it('renders icon image when provided', () => {
        const { container } = renderInProvider(<Header title="My Website" icon="https://example.com/icon.png" />);
        const img = container.querySelector('.header__icon');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
    });
});

// ---------------------------------------------------------------------------
// 2. HeroBanner
// ---------------------------------------------------------------------------
describe('HeroBanner', () => {
    it('renders the heading in an h1', () => {
        renderInProvider(<HeroBanner heading="Welcome" />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome');
    });

    it('renders subheading when provided', () => {
        renderInProvider(<HeroBanner heading="Welcome" subheading="Everything you need" />);
        expect(screen.getByText('Everything you need')).toBeInTheDocument();
    });


    it('applies background as inline style when provided', () => {
        const { container } = renderInProvider(
            <HeroBanner heading="Welcome" background="blue" />
        );
        expect(container.querySelector('.hero_banner')).toHaveStyle({ background: 'blue' });
    });

});

// ---------------------------------------------------------------------------
// 3. Container
// ---------------------------------------------------------------------------
describe('Container', () => {
    it('renders children', () => {
        renderInProvider(
            <Container>
                <p>Child content</p>
            </Container>
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('applies data-padding-y attribute', () => {
        const { container } = renderInProvider(
            <Container paddingY="lg">
                <p>Test</p>
            </Container>
        );
        expect(container.querySelector('.container_block')).toHaveAttribute('data-padding-y', 'lg');
    });

    it('applies maxWidth on inner div', () => {
        const { container } = renderInProvider(
            <Container maxWidth={800}>
                <p>Test</p>
            </Container>
        );
        expect(container.querySelector('.container_block__inner')).toHaveStyle({ maxWidth: '800px' });
    });

    it('applies maxHeight on content div when scrollable', () => {
        const { container } = renderInProvider(
            <Container scrollable={true} maxHeight={300}>
                <p>Test</p>
            </Container>
        );
        expect(container.querySelector('.container_block__content')).toHaveStyle({ maxHeight: '300px' });
    });
});

// ---------------------------------------------------------------------------
// 4. Footer
// ---------------------------------------------------------------------------
describe('Footer', () => {
    it('renders tagline', () => {
        renderInProvider(<Footer tagline="Building great things" copyright="2026" />);
        expect(screen.getByText('Building great things')).toBeInTheDocument();
    });

    it('renders copyright', () => {
        renderInProvider(<Footer copyright="© 2026 My Company" />);
        expect(screen.getByText('© 2026 My Company')).toBeInTheDocument();
    });

    it('renders column headings', () => {
        const columns = [
            { heading: 'Product', links: [{ label: 'Features', href: '/features' }] },
            { heading: 'Company', links: [{ label: 'About', href: '/about' }] },
        ];
        renderInProvider(<Footer columns={columns} />);
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('renders column links', () => {
        const columns = [
            { heading: 'Product', links: [{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }] },
        ];
        renderInProvider(<Footer columns={columns} />);
        expect(screen.getByText('Features')).toHaveAttribute('href', '/features');
        expect(screen.getByText('Pricing')).toHaveAttribute('href', '/pricing');
    });

    it('does not render columns section when columns omitted', () => {
        const { container } = renderInProvider(<Footer tagline="Test" />);
        expect(container.querySelector('.footer__columns')).not.toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 5. FooterSimple
// ---------------------------------------------------------------------------
describe('FooterSimple', () => {
    it('renders tagline', () => {
        renderInProvider(<FooterSimple tagline="Built with care." />);
        expect(screen.getByText('Built with care.')).toBeInTheDocument();
    });

    it('renders copyright', () => {
        renderInProvider(<FooterSimple copyright="© 2026 My Company" />);
        expect(screen.getByText('© 2026 My Company')).toBeInTheDocument();
    });

    it('renders links', () => {
        const links = [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ];
        renderInProvider(<FooterSimple links={links} />);
        expect(screen.getByText('Privacy')).toHaveAttribute('href', '/privacy');
        expect(screen.getByText('Terms')).toHaveAttribute('href', '/terms');
    });

    it('does not render nav when links omitted', () => {
        renderInProvider(<FooterSimple tagline="Test" />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// 6. TextBlock
// ---------------------------------------------------------------------------
describe('TextBlock', () => {
    it('renders body text', () => {
        renderInProvider(<TextBlock body="Hello world" align="left" />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders heading when provided', () => {
        renderInProvider(<TextBlock heading="Title" body="Body" align="left" />);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
    });

    it('marks heading as empty when omitted', () => {
        const { container } = renderInProvider(<TextBlock body="Body" align="left" />);
        const heading = container.querySelector('h2');
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveAttribute('data-empty');
    });

    it('renders subtext when provided', () => {
        renderInProvider(<TextBlock body="Body" subtext="Fine print" align="left" />);
        expect(screen.getByText('Fine print')).toBeInTheDocument();
    });

    it('applies data-align attribute', () => {
        const { container } = renderInProvider(<TextBlock body="Body" align="center" />);
        expect(container.querySelector('.text_block')).toHaveAttribute('data-align', 'center');
    });
});

// ---------------------------------------------------------------------------
// 7. MediaText
// ---------------------------------------------------------------------------
describe('MediaText', () => {
    it('renders image with correct src and alt', () => {
        renderInProvider(
            <MediaText imageQuery="coffee" imageSrc="https://placehold.co/600x400" imageAlt="A photo" body="Description" imagePosition="left" />
        );
        const img = screen.getByAltText('A photo');
        expect(img).toHaveAttribute('src', 'https://placehold.co/600x400');
    });

    it('renders body text', () => {
        renderInProvider(
            <MediaText imageQuery="coffee" imageSrc="https://placehold.co/600x400" imageAlt="Photo" body="Some text" imagePosition="left" />
        );
        expect(screen.getByText('Some text')).toBeInTheDocument();
    });

    it('renders heading when provided', () => {
        renderInProvider(
            <MediaText imageQuery="coffee" imageSrc="https://placehold.co/600x400" imageAlt="Photo" heading="Section Title" body="Body" imagePosition="left" />
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section Title');
    });

    it('applies data-image-position attribute', () => {
        const { container } = renderInProvider(
            <MediaText imageQuery="coffee" imageSrc="https://placehold.co/600x400" imageAlt="Photo" body="Body" imagePosition="right" />
        );
        expect(container.querySelector('.media_text')).toHaveAttribute('data-image-position', 'right');
    });
});

// ---------------------------------------------------------------------------
// 8. CardRow
// ---------------------------------------------------------------------------
describe('CardRow', () => {
    const cards = [
        { title: 'Card A', body: 'Body A', imageSrc: 'https://placehold.co/300x200', imageAlt: 'Image A' },
        { title: 'Card B', body: 'Body B' },
        { title: 'Card C' },
    ];

    it('renders the correct number of cards', () => {
        const { container } = renderInProvider(<CardRow cards={cards} />);
        expect(container.querySelectorAll('.card')).toHaveLength(3);
    });

    it('renders card titles', () => {
        renderInProvider(<CardRow cards={cards} />);
        expect(screen.getByText('Card A')).toBeInTheDocument();
        expect(screen.getByText('Card B')).toBeInTheDocument();
        expect(screen.getByText('Card C')).toBeInTheDocument();
    });

    it('renders card bodies when provided', () => {
        renderInProvider(<CardRow cards={cards} />);
        expect(screen.getByText('Body A')).toBeInTheDocument();
        expect(screen.getByText('Body B')).toBeInTheDocument();
    });

    it('renders card images when provided', () => {
        renderInProvider(<CardRow cards={cards} />);
        expect(screen.getByAltText('Image A')).toHaveAttribute('src', 'https://placehold.co/300x200');
    });
});

// ---------------------------------------------------------------------------
// 9. CardGrid
// ---------------------------------------------------------------------------
describe('CardGrid', () => {
    const cards = [
        { title: 'Grid Card 1', body: 'Body 1' },
        { title: 'Grid Card 2', body: 'Body 2' },
    ];

    it('renders the correct number of cards', () => {
        const { container } = renderInProvider(<CardGrid cards={cards} columns={2} />);
        expect(container.querySelectorAll('.card')).toHaveLength(2);
    });

    it('renders card titles', () => {
        renderInProvider(<CardGrid cards={cards} columns={2} />);
        expect(screen.getByText('Grid Card 1')).toBeInTheDocument();
        expect(screen.getByText('Grid Card 2')).toBeInTheDocument();
    });

    it('applies data-columns attribute', () => {
        const { container } = renderInProvider(<CardGrid cards={cards} columns={3} />);
        expect(container.querySelector('.card_grid')).toHaveAttribute('data-columns', '3');
    });
});

// ---------------------------------------------------------------------------
// 10. Spotlight
// ---------------------------------------------------------------------------
describe('Spotlight', () => {
    const spotlightProps = {
        image: 'https://example.com/photo.jpg',
        overline: 'About us',
        title: 'Handcraft since 1987',
        body: 'We care deeply about the work we put into every piece.',
        caption: '— Max Müller, Owner',
        imagePosition: 'left' as const,
    };

    it('renders the title in an h2', () => {
        renderInProvider(<Spotlight {...spotlightProps} />);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Handcraft since 1987');
    });

    it('renders the body text', () => {
        renderInProvider(<Spotlight {...spotlightProps} />);
        expect(screen.getByText(/We care deeply/)).toBeInTheDocument();
    });

    it('renders the overline when provided', () => {
        renderInProvider(<Spotlight {...spotlightProps} />);
        expect(screen.getByText('About us')).toBeInTheDocument();
    });

    it('renders the caption when provided', () => {
        renderInProvider(<Spotlight {...spotlightProps} />);
        expect(screen.getByText('— Max Müller, Owner')).toBeInTheDocument();
    });

    it('renders the image with correct src and falls back to title as alt', () => {
        const { container } = renderInProvider(<Spotlight {...spotlightProps} />);
        const img = container.querySelector('.spotlight__image');
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
        expect(img).toHaveAttribute('alt', 'Handcraft since 1987');
    });

    it('marks overline and caption as empty when omitted', () => {
        const { container } = renderInProvider(
            <Spotlight
                image={spotlightProps.image}
                title={spotlightProps.title}
                body={spotlightProps.body}
                imagePosition="left"
            />
        );
        const overline = container.querySelector('.spotlight__overline');
        const caption = container.querySelector('.spotlight__caption');
        expect(overline).toBeInTheDocument();
        expect(overline).toHaveAttribute('data-empty');
        expect(caption).toBeInTheDocument();
        expect(caption).toHaveAttribute('data-empty');
    });

    it('applies data-image-position attribute', () => {
        const { container } = renderInProvider(<Spotlight {...spotlightProps} imagePosition="right" />);
        expect(container.querySelector('.spotlight')).toHaveAttribute('data-image-position', 'right');
    });
});

// ---------------------------------------------------------------------------
// 10b. RecommendationRow
// ---------------------------------------------------------------------------
describe('RecommendationRow', () => {
    const items = [
        { name: 'Süddeutsche Zeitung', source: 'Feuilleton', rating: 4.5, quote: 'Ein erfrischender Ansatz.' },
        { name: 'Anja Müller', source: 'Kundin', rating: 5, quote: 'Einfach großartig.' },
        { name: 'techradar.de', rating: 4, quote: 'Solide Umsetzung.' },
    ];

    it('renders the correct number of recommendations', () => {
        const { container } = renderInProvider(<RecommendationRow items={items} />);
        expect(container.querySelectorAll('.recommendation')).toHaveLength(3);
    });

    it('renders the heading when provided', () => {
        renderInProvider(<RecommendationRow heading="Was andere sagen" items={items} />);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Was andere sagen');
    });

    it('does not render heading when omitted', () => {
        renderInProvider(<RecommendationRow items={items} />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders each reviewer name, source and quote', () => {
        renderInProvider(<RecommendationRow items={items} />);
        expect(screen.getByText('Süddeutsche Zeitung')).toBeInTheDocument();
        expect(screen.getByText('Feuilleton')).toBeInTheDocument();
        expect(screen.getByText(/Ein erfrischender Ansatz/)).toBeInTheDocument();
    });

    it('exposes the rating via aria-label for accessibility', () => {
        const { container } = renderInProvider(<RecommendationRow items={items} />);
        const stars = container.querySelectorAll('.recommendation__stars');
        expect(stars[0]).toHaveAttribute('aria-label', '4.5 von 5 Sternen');
        expect(stars[1]).toHaveAttribute('aria-label', '5 von 5 Sternen');
    });

    it('renders the reviewer image with correct src when provided', () => {
        const withImage = [{ name: 'N', rating: 5, quote: 'Q', image: 'https://example.com/a.jpg' }];
        const { container } = renderInProvider(<RecommendationRow items={withImage} />);
        const img = container.querySelector('.recommendation__image');
        expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
    });
});

// ---------------------------------------------------------------------------
// 11. StatRow
// ---------------------------------------------------------------------------
describe('StatRow', () => {
    const stats = [
        { value: '10k+', label: 'Active Users' },
        { value: '99%', label: 'Uptime' },
        { value: '24/7', label: 'Support' },
    ];

    it('renders all stat values', () => {
        renderInProvider(<StatRow stats={stats} align="center" />);
        expect(screen.getByText('10k+')).toBeInTheDocument();
        expect(screen.getByText('99%')).toBeInTheDocument();
        expect(screen.getByText('24/7')).toBeInTheDocument();
    });

    it('renders all stat labels', () => {
        renderInProvider(<StatRow stats={stats} align="center" />);
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Uptime')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('renders the correct number of tiles', () => {
        const { container } = renderInProvider(<StatRow stats={stats} align="center" />);
        expect(container.querySelectorAll('.stat_row__tile')).toHaveLength(3);
    });

    it('applies data-align attribute', () => {
        const { container } = renderInProvider(<StatRow stats={stats} align="left" />);
        expect(container.querySelector('.stat_row')).toHaveAttribute('data-align', 'left');
    });
});

// ---------------------------------------------------------------------------
// 12. ImageBlock
// ---------------------------------------------------------------------------
describe('ImageBlock', () => {
    it('renders image with correct src and alt', () => {
        renderInProvider(
            <ImageBlock imageQuery="workspace" src="https://example.com/photo.jpg" alt="A photo" objectFit="cover" maxHeight={400} />
        );
        const img = screen.getByAltText('A photo');
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('renders caption when provided', () => {
        renderInProvider(
            <ImageBlock imageQuery="workspace" src="https://example.com/photo.jpg" alt="Photo" caption="A beautiful view" objectFit="cover" maxHeight={400} />
        );
        expect(screen.getByText('A beautiful view')).toBeInTheDocument();
    });

    it('marks caption as empty when omitted', () => {
        const { container } = renderInProvider(
            <ImageBlock imageQuery="workspace" src="https://example.com/photo.jpg" alt="Photo" objectFit="cover" maxHeight={400} />
        );
        const caption = container.querySelector('.image_block__caption');
        expect(caption).toBeInTheDocument();
        expect(caption).toHaveAttribute('data-empty');
    });

    it('applies objectFit and maxHeight as inline styles on image', () => {
        renderInProvider(
            <ImageBlock imageQuery="workspace" src="https://example.com/photo.jpg" alt="Photo" objectFit="contain" maxHeight={250} />
        );
        const img = screen.getByAltText('Photo');
        expect(img).toHaveStyle({ objectFit: 'contain', maxHeight: '250' });
    });
});

// ---------------------------------------------------------------------------
// 13. Gallery
// ---------------------------------------------------------------------------
describe('Gallery', () => {
    const images = [
        { imageQuery: 'landscape one', src: 'https://example.com/1.jpg', alt: 'Image 1', caption: 'First' },
        { imageQuery: 'landscape two', src: 'https://example.com/2.jpg', alt: 'Image 2' },
        { imageQuery: 'landscape three', src: 'https://example.com/3.jpg', alt: 'Image 3', caption: 'Third' },
    ];

    it('renders the correct number of images', () => {
        const { container } = renderInProvider(<Gallery images={images} columns={3} gap="md" />);
        expect(container.querySelectorAll('.gallery__item')).toHaveLength(3);
    });

    it('renders images with correct src and alt', () => {
        renderInProvider(<Gallery images={images} columns={3} gap="md" />);
        const img1 = screen.getByAltText('Image 1');
        expect(img1).toHaveAttribute('src', 'https://example.com/1.jpg');
        const img2 = screen.getByAltText('Image 2');
        expect(img2).toHaveAttribute('src', 'https://example.com/2.jpg');
    });

    it('renders captions when provided', () => {
        renderInProvider(<Gallery images={images} columns={3} gap="md" />);
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('applies data-columns attribute', () => {
        const { container } = renderInProvider(<Gallery images={images} columns={2} gap="md" />);
        expect(container.querySelector('.gallery__grid')).toHaveAttribute('data-columns', '2');
    });

    it('applies data-gap attribute', () => {
        const { container } = renderInProvider(<Gallery images={images} columns={3} gap="lg" />);
        expect(container.querySelector('.gallery__grid')).toHaveAttribute('data-gap', 'lg');
    });
});
